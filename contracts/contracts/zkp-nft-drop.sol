//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IMT/IncrementalMerkleTree.sol";

contract ZKPNFTDrop is ERC721, IncrementalMerkleTree {
    struct Minter {
        address owner;
        uint256 hashOfSecret;
        uint256 tokenId;
    }

    uint256 ZERO_VALUE = uint256(keccak256(abi.encodePacked('Maci'))) % SNARK_SCALAR_FIELD;

    uint256 public price;
    uint256 public hashOfTeamSecret;

    uint256 public buyDeadline;

    mapping (uint => Minter) minters;
    mapping (address => uint) minterReverse;

    using Counters for Counters.Counter;
    Counters.Counter mintersCounter;

    constructor(uint256 _price, uint256 _hashOfTeamSecret, uint256 _buyDeadline) ERC721("ZKPNFTDrop", "ZKPNFT$") IncrementalMerkleTree(3, ZERO_VALUE, true) {
        price = _price;
        hashOfTeamSecret = _hashOfTeamSecret;
        insertLeaf(hashOfTeamSecret);
        buyDeadline = _buyDeadline;
    }

    function buy(uint256 hashOfSecret) public payable {
        require(msg.value == price, "needs to pay a specific amount");
        require(msg.sender != owner(), "owner cannot mint");
        require(block.number < buyDeadline, "buy deadline passed");

        uint minterId = mintersCounter.current();
        require(minterId < 7, "all tokens minted"); // TODO parametrize max number of minters

        minterReverse[msg.sender] = minterId;
        minters[minterId].owner = msg.sender;
        minters[minterId].hashOfSecret = hashOfSecret;
        minters[minterId].tokenId = minterId; // shoufled with the result secret later
        mintersCounter.increment();
        insertLeaf(hashOfSecret);
    }

    function verify(uint256 result, bytes memory zkp) public {
        require(block.number > buyDeadline, "buy deadline not passed");
        require(block.number < buyDeadline + 7000, "verify deadline passed");
        // TODO: verify zkp


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
