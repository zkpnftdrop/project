// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";
import * as fs from "fs";

import { proofGen } from "../scripts/proofGen";

task("verifyMint", "verify nft minting")
  .addParam("nft", "nft_address", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
  .addParam("signer", "signer index", "0")
  .addParam("secrets", "path to secrets.json")
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[parseInt(taskArgs.signer)];
    const nft = await hre.ethers.getContractAt("ZKPNFTDrop", taskArgs.nft);

    const secretsN = JSON.parse(
      fs.readFileSync(taskArgs.secrets) as unknown as string
    ) as number[];
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    const secrets = secretsN.map((x) => BigInt(x.toString()));

    // TODO: where are the paths?
    await proofGen(3, secrets, "", "");

    // TODO read result
    const result = 42;
    const proof = [42, 42, 42, 42, 42, 42, 42, 42];

    await nft.connect(signer).verify(result, proof as any);
});
