//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IMT/IncrementalMerkleTree.sol";
import { IVerifier } from "./IVerifier.sol";

contract ZKPNFTDrop is ERC721, IncrementalMerkleTree {
    struct Minter {
        address owner;
        uint256 hashOfSecret;
        uint256 tokenId;
    }

    uint256 internal constant ZERO_VALUE = uint256(keccak256(abi.encodePacked('Maci'))) % SNARK_SCALAR_FIELD;
    uint32 internal MAX_MINTERS = 7;
    uint32 internal VERIFY_PERIOD = 8000;

    uint256 public price;
    uint256 public hashOfTeamSecret;

    uint256 public buyDeadline;

    mapping (uint => Minter) public minters;

    using Counters for Counters.Counter;
    Counters.Counter mintersCounter;

    IVerifier public verifier;

    constructor(
        uint256 _price,
        uint256 _hashOfTeamSecret,
        uint256 _buyDeadline,
        IVerifier _verifier
    )
    ERC721("ZKPNFTDrop", "ZKPNFT$")
    IncrementalMerkleTree(3, ZERO_VALUE, true)
    {
        price = _price;
        hashOfTeamSecret = _hashOfTeamSecret;
        insertLeaf(hashOfTeamSecret);
        buyDeadline = _buyDeadline;
        verifier = _verifier;
    }

    function buy(uint256 hashOfSecret) public payable {
        require(msg.value == price, "needs to pay a specific amount");
        require(msg.sender != owner(), "owner cannot mint");
        require(block.number < buyDeadline, "buy deadline passed");

        uint minterId = mintersCounter.current();
        require(minterId < MAX_MINTERS, "all tokens minted"); // TODO parametrize max number of minters

        minters[minterId].owner = msg.sender;
        minters[minterId].hashOfSecret = hashOfSecret;
        minters[minterId].tokenId = minterId; // shoufled with the result secret later
        mintersCounter.increment();
        insertLeaf(hashOfSecret);
    }

    function verify(
        uint256 result,
        uint256[8] memory proof
    ) public {
        require(block.number > buyDeadline, "buy deadline not passed");
        require(block.number < buyDeadline + VERIFY_PERIOD, "verify deadline passed");

        uint256[2] memory publicSignals = [result, root];

        bool isValid = verifier.verify(proof, publicSignals);

        require(isValid, "invalid proof");

        // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
        for (uint i = mintersCounter.current() -1; i > 0; i--) {
            uint j = result % i;
            uint256 aux = minters[i].tokenId;
            minters[i].tokenId = minters[j].tokenId;
            minters[j].tokenId = aux;
        }

        for (uint i = 0; i < mintersCounter.current(); i++) {
            _safeMint(minters[i].owner, minters[i].tokenId);
        }
    }

    function numberOfMinters() public view returns (uint256) {
        return mintersCounter.current();
    }
}
