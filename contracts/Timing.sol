pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract Timing {
    mapping (uint => uint) mp;
    
    function change(uint n, uint newValue) public {
        for (uint i = 0; i < n; i++) {
            mp[i] = newValue;
        }
    }
}