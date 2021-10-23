// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

abstract contract IVerifier {
    function verify(
        uint256[8] memory,
        uint256[2] memory
    ) virtual public view returns (bool);
}
