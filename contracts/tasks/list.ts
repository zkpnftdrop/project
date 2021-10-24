// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";

task("buy", "buy a nft token")
  .addParam("nft", "nft_address", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
  .setAction(async (taskArgs, hre) => {
    const nft = await hre.ethers.getContractAt("ZKPNFTDrop", taskArgs.nft);

    const nMinters = await nft.numberOfMinters();
    for (let i = 0; i < nMinters.toNumber(); i++) {
      console.log(await nft.minters(i));
    }
  });
