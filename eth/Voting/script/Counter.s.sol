// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {Voting} from "../src/Voting.sol";

contract VotingScript is Voting {
    Voting public voting;

    function setUp() public {}

    function run() public {
        voting = new Voting();
    }
}
