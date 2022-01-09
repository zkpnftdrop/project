#!/usr/bin/env bash

cd contracts

echo
echo "Deploying contracts"

NFT=$(npx hardhat deploy)
echo "Deployed at $NFT"

echo
echo "Buying NFTs"

HASH1=1942946421912450584259586097568107395688365813414106029590369626161869439808
HASH2=7477412169588304551017408076950858400020738203289951393688324886195168792783
HASH3=9894251275956659733313857148258390144455321953073386800950017523886377879287

npx hardhat buy --nft $NFT --hash $HASH1 --signer 1
npx hardhat buy --nft $NFT --hash $HASH2 --signer 2
npx hardhat buy --nft $NFT --hash $HASH1 --signer 3

echo "[\"10000\", \"1888\", \"2888\", \"3888\", \"0\", \"0\", \"0\", \"0\"]" > secrets.json

echo
echo "Generating the ZKP and assigning NFT IDs to minters using the random number"

npx hardhat verifyMint --nft $NFT --secrets secrets.json  --rapidsnark ~/rapidsnark/build/prover --circuits ../circuits

echo
echo "The NFTs are assigned as such:"

npx hardhat list --nft $NFT

echo
echo "Viola!"
