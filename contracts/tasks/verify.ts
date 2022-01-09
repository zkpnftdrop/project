// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import * as fs from "fs";
// @ts-ignore
import {HardhatRuntimeEnvironment} from "hardhat/types";

import { proofGen } from "../scripts/proofGen";

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

task("verifyMint", "verify nft minting")
  .addParam("nft", "nft_address", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
  .addParam("signer", "signer index", "0")
  .addParam("secrets", "path to secrets.json")
  .addParam("rapidsnark", "path to rapidsnark")
  .addParam("circuits", "path to circuits/")
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[parseInt(taskArgs.signer)];
    const nft = await hre.ethers.getContractAt("ZKPNFTDrop", taskArgs.nft);

    // secrets.json is an array of strings because JS doesn't work well with
    // numbers above 9007199254740991.
    const secretsN = JSON.parse(
      fs.readFileSync(taskArgs.secrets) as unknown as string
    ) as string[];

    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    const secrets = secretsN.map((x) => BigInt(x.toString()));

    const r: any = await proofGen(3, secrets, taskArgs.rapidsnark, taskArgs.circuits);

    const result = r.publicInputs[0];
    const proof = r.proof;

    const proofForTx: any = [
        proof.pi_a[0],
        proof.pi_a[1],
        proof.pi_b[0][1],
        proof.pi_b[0][0],
        proof.pi_b[1][1],
        proof.pi_b[1][0],
        proof.pi_c[0],
        proof.pi_c[1],
    ];

    const buyDeadline = await nft.buyDeadline();
    await mine(hre)(Number(buyDeadline.toString()));

    const tx = await nft.connect(signer).verifyMint(result, proofForTx);
    const receipt = await tx.wait();
});
