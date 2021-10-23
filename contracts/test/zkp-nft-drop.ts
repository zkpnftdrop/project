// @ts-ignore
import { proofGen, } from 'zkpnftdrop-cli'

import * as chai from "chai";
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

import * as hre from "hardhat";
const ethers = hre.ethers;
import { ZKPNFTDrop } from "../typechain";
import {BigNumber, Signer} from "ethers";
// @ts-ignore
import { poseidon } from "circomlibjs";
import {HardhatRuntimeEnvironment} from "hardhat/types";

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
  const hashOfTeamSecret = poseidon([teamSecret]);
  const buyDeadline = 1000;

  beforeEach(async function () {
    [creator, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    const Poseidon = await ethers.getContractFactory("PoseidonT3", creator);
    const poseidon = await Poseidon.deploy();
    await poseidon.deployed();

    const Verifier = await ethers.getContractFactory("MockVerifier", creator);
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
    const hashOMinter1Secret = poseidon([minter1Secret]);

    expect(await contract.numberOfMinters()).to.equal(0);
    await contract.connect(addr1).buy(hashOMinter1Secret, { value: price });
    expect(await contract.numberOfMinters()).to.equal(1);

    const minter2Secret = 2888;
    const hashOMinter2Secret = poseidon([minter2Secret]);

    await contract.connect(addr2).buy(hashOMinter2Secret, { value: price });
    expect(await contract.numberOfMinters()).to.equal(2);
  });

  it("cannot buy without paying", async function () {
    await contract.deployed();
    const minter1Secret = 1888;
    const hashOMinter1Secret = poseidon([minter1Secret]);
    await expect(
      contract.connect(addr1).buy(hashOMinter1Secret, { value: price - 1 })
    ).to.eventually.be.rejected;
    expect(await contract.numberOfMinters()).to.equal(0);
  });

  it("can buy and then verify", async function () {
    await contract.deployed();

    const minter1Secret = 1888;
    const hashOMinter1Secret = poseidon([minter1Secret]);
    await contract.connect(addr1).buy(hashOMinter1Secret, { value: price });

    const minter2Secret = 2888;
    const hashOMinter2Secret = poseidon([minter2Secret]);
    await contract.connect(addr2).buy(hashOMinter2Secret, { value: price });

    const minter3Secret = 3888;
    const hashOMinter3Secret = poseidon([minter3Secret]);
    await contract.connect(addr3).buy(hashOMinter3Secret, { value: price });

    await mine(hre)(buyDeadline);

    const result = 909090;
    const zkp = [0, 0, 0, 0, 0, 0, 0, 0].map((x) => ethers.BigNumber.from(x));

    // @ts-ignore
    await contract.connect(creator).verify(result, zkp);
  });
});
