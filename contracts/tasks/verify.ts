// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import * as fs from "fs";

import { proofGen } from "../scripts/proofGen";

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

    // TODO read result
    const result = r.publicInputs.result;
    const proof = r.proof;

    const proofForTx = [
        proof.pi_a[0],
        proof.pi_a[1],
        proof.pi_b[0][1],
        proof.pi_b[0][0],
        proof.pi_b[1][1],
        proof.pi_b[1][0],
        proof.pi_c[0],
        proof.pi_c[1],
    ].map((x) => BigInt(x));

    //await nft.connect(signer).verify(result, proof as any);
});
