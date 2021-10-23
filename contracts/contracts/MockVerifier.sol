// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract MockVerifier {
    function verify(
        uint256[8] memory,
        uint256[2] memory
    ) public pure returns (bool) {
        return true;
    }
}
