// File: `./contracts/SimpleStorage.sol`

pragma solidity ^0.5.0;

contract SimpleStorage {
  uint public storedData;

  constructor(uint initVal) public {
    storedData = initVal;
  }

  function set(uint x) public {
    storedData = x;
  }

  function get() view public returns (uint retVal) {
    return storedData;
  }

  function sum(uint a, uint b) pure public returns (uint c) {
    c = a+b;
  }

  function iterate(uint n) public {
    for (uint i = 0; i < n; ++i) {
      storedData += 1;
    }
  }
}