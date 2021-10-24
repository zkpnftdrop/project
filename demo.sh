#!/usr/bin/env bash

cd contracts

echo "Launching node"

npx hardhat node &
sleep 2

echo "Deploying contracts"

NFT=$(npx hardhat deploy)
echo $NFT

echo "Buying ntfs"

HASH1=1942946421912450584259586097568107395688365813414106029590369626161869439808n
HASH2=7477412169588304551017408076950858400020738203289951393688324886195168792783n
HASH3=9894251275956659733313857148258390144455321953073386800950017523886377879287n

npx hardhat buy --nft $NFT --hash $HASH1 --signer 1
npx hardhat buy --nft $NFT --hash $HASH2 --signer 2
npx hardhat buy --nft $NFT --hash $HASH1 --signer 3

echo "Calculating off-chain aggregated secret"

echo "[\"10000\", \"1888\", \"2888\", \"3888\", \"0\", \"0\", \"0\", \"0\"]" > secrets.json

echo "Verifying using ZKP and minting with random assignation"

npx hardhat verifyMint --nft $NFT --secrets secrets.json

echo "Show NFTs assignation"

npx hardhat showMint --nft $NFT
