// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SimpleContract {
    uint256 public data;
    address public owner;

    constructor(address contractOwner) {
        owner = contractOwner;
    }

    function set(uint256 _value) public {
        data = _value;
    }

    function get() public view returns (uint256) {
        return data;
    }
}
