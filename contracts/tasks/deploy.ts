// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";

task("deploy", "deploy nft")
  .addParam("signer", "signer index", "0")
  .setAction(async (taskArgs, hre) => {
    const signers = await hre.ethers.getSigners();
    const Poseidon = await hre.ethers.getContractFactory(
      "PoseidonT3",
      signers[parseInt(taskArgs.signer)]
    );
    const poseidon = await Poseidon.deploy();
    await poseidon.deployed();

    const Verifier = await hre.ethers.getContractFactory("MockVerifier");
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    const NFT = await hre.ethers.getContractFactory("ZKPNFTDrop", {
      libraries: {
        PoseidonT3: poseidon.address,
      },
    });
    const nft = await NFT.connect(signers[parseInt(taskArgs.signer)]).deploy(
      9999,
      10000,
      1000,
      verifier.address
    );
    await nft.deployed();

    console.log(nft.address);
  });
