import * as hre from "hardhat";
import { ZKPNFTDrop } from "../typechain";
import {BigNumber, Signer} from "ethers";
import * as chai from "chai";
import * as fs from "fs";

// @ts-ignore
import {HardhatRuntimeEnvironment} from "hardhat/types";

import {
  IncrementalQuinTree,
  hash2,
  hash1,
  stringifyBigInts,
  genHashOnion,
  // @ts-ignore
} from "zkpnftdrop-circuits";

const chaiAsPromised = require("chai-as-promised");
const ethers = hre.ethers;
chai.use(chaiAsPromised);
const expect = chai.expect;

// from https://github.com/atixlabs/hardhat-time-n-mine
const mineOneBlock = async (hre: HardhatRuntimeEnvironment) =>
  hre.network.provider.send("evm_mine", []);
const mineChunk = async (hre: HardhatRuntimeEnvironment, amount: number) =>
  Promise.all(
    Array.from({ length: amount }, () => mineOneBlock(hre))
  ) as unknown as Promise<void>;
const mine = (hre: HardhatRuntimeEnvironment) => async (amount: number) => {
  if (amount < 0)
    throw new Error("mine cannot be called with a negative value");
  const MAX_PARALLEL_CALLS = 1000;
  // Do it on parallel but do not overflow connections
  for (let i = 0; i < Math.floor(amount / MAX_PARALLEL_CALLS); i++) {
    await mineChunk(hre, MAX_PARALLEL_CALLS);
  }
  return mineChunk(hre, amount % MAX_PARALLEL_CALLS);
};

describe("ZKP NFT Drop", function () {

  let factory;
  let contract: ZKPNFTDrop;
  let creator: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;
  let addrs: Signer[];

  const price = 9999;
  const teamSecret = 10000;
  const hashOfTeamSecret = hash1([teamSecret]);
  const buyDeadline = 1000;

  beforeEach(async function () {
    [creator, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    const Poseidon = await ethers.getContractFactory("PoseidonT3", creator);
    const poseidon = await Poseidon.deploy();
    await poseidon.deployed();

    const Verifier = await ethers.getContractFactory("TestVerifier", creator);
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    factory = await ethers.getContractFactory("ZKPNFTDrop", {
      libraries: {
        PoseidonT3: poseidon.address,
      },
    });

    contract = await factory.deploy(
      price,
      hashOfTeamSecret,
      buyDeadline,
      verifier.address
    );
  });

  it("Can deploy NFT", async function () {
    await contract.deployed();
    expect(await contract.price()).to.equal(9999);
    expect(await contract.hashOfTeamSecret()).to.equal(hashOfTeamSecret);
    expect(await contract.buyDeadline()).to.equal(buyDeadline);
  });

  it("can buy", async function () {
    await contract.deployed();
    const minter1Secret = 1888;
    const hashOMinter1Secret = hash1([minter1Secret]);

    expect(await contract.numberOfMinters()).to.equal(0);
    await contract.connect(addr1).buy(hashOMinter1Secret, { value: price });
    expect(await contract.numberOfMinters()).to.equal(1);

    const minter2Secret = 2888;
    const hashOMinter2Secret = hash1([minter2Secret]);

    await contract.connect(addr2).buy(hashOMinter2Secret, { value: price });
    expect(await contract.numberOfMinters()).to.equal(2);
  });

  it("cannot buy without paying", async function () {
    await contract.deployed();
    const minter1Secret = 1888;
    const hashOMinter1Secret = hash1([minter1Secret]);
    await expect(
      contract.connect(addr1).buy(hashOMinter1Secret, { value: price - 1 })
    ).to.eventually.be.rejected;
    expect(await contract.numberOfMinters()).to.equal(0);
  });

  it("can buy and then verify", async function () {
    await contract.deployed();

    const minter1Secret = 1888;
    const hashOMinter1Secret = hash1([minter1Secret]);
    await contract.connect(addr1).buy(hashOMinter1Secret, { value: price });

    const minter2Secret = 2888;
    const hashOMinter2Secret = hash1([minter2Secret]);
    await contract.connect(addr2).buy(hashOMinter2Secret, { value: price });

    const minter3Secret = 3888;
    const hashOMinter3Secret = hash1([minter3Secret]);
    await contract.connect(addr3).buy(hashOMinter3Secret, { value: price });

    await mine(hre)(buyDeadline);

    const LEVELS = 3;
    const ZERO_VALUE = BigInt(0);

    const tree = new IncrementalQuinTree(LEVELS, ZERO_VALUE, 2, hash2);
    tree.insert(hashOfTeamSecret);
    tree.insert(hashOMinter1Secret);
    tree.insert(hashOMinter2Secret);
    tree.insert(hashOMinter3Secret);
    tree.insert(hash1([ZERO_VALUE]));
    tree.insert(hash1([ZERO_VALUE]));
    tree.insert(hash1([ZERO_VALUE]));
    tree.insert(hash1([ZERO_VALUE]));

    expect(await contract.root()).to.equal(tree.root);
    const randNums = [
        teamSecret,
        minter1Secret,
        minter2Secret,
        minter3Secret,
        ZERO_VALUE,
        ZERO_VALUE,
        ZERO_VALUE,
        ZERO_VALUE,
    ].map((x) => x.toString())

    const circuitInputs = stringifyBigInts({
      randNums,
      root: tree.root,
    });
    fs.writeFileSync("input.json", JSON.stringify(circuitInputs));

    const result = genHashOnion(randNums);

    const zkp = [
        "846400121213406487964685232890528083629439740021375953073524691579512450339",  // a0
        "6320579568828324268425971843668008577172629299864868075857422617578976175186", // a1

        "5081999809014330757910749462823652376910386431969478601092965136049138952899",  // b01
        "677350940708847790327167481985113117010277348724001883743116207170760459473",   // b00
        "19812731417442109423029774596774984937251730136111195964592107604245793594275", // b11
        "14112428479020884408350756678640393572113981123338043946389271584445845936777", // b10
        
        "16262398447770972434745981312703578314371702066063024517196898203573448827597", // c0
        "16906950376228888199307951005374296884724412383507704409706432165298442618925", // c1

    ].map((x) => ethers.BigNumber.from(x));

    // @ts-ignore
    await contract.connect(creator).verify(result, zkp);
  });
});
