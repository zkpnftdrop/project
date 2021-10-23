// eslint-disable-next-line node/no-unpublished-import
import { task } from "hardhat/config";

task("buy", "buy a nft token")
  .addParam("nft", "nft_address", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
  .addParam("hash", "hash of user secret")
  .addParam("signer", "signer index")
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[parseInt(taskArgs.signer)];
    const nft = await hre.ethers.getContractAt("ZKPNFTDrop", taskArgs.nft);

    const price = await nft.price();

    await nft.connect(signer).buy(taskArgs.hash, {
      value: price,
    });
});
