// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Voting.sol";

contract VotingTest is Test {
    Voting public voting;

    address owner = address(this);
    address alice = makeAddr("alice");
    address bob   = makeAddr("bob");
    address carol = makeAddr("carol");

    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------

    function setUp() public {
        voting = new Voting();
    }

    // -------------------------------------------------------------------------
    // addCandidate
    // -------------------------------------------------------------------------

    function test_AddCandidate_Owner() public {
        voting.addCandidate("Alice");
        Voting.Candidate[] memory candidates = voting.getCandidates();
        assertEq(candidates.length, 1);
        assertEq(candidates[0].name, "Alice");
        assertEq(candidates[0].voteCount, 0);
    }

    function test_AddCandidate_MultipleCandidates() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");
        voting.addCandidate("Carol");
        Voting.Candidate[] memory candidates = voting.getCandidates();
        assertEq(candidates.length, 3);
        assertEq(candidates[1].name, "Bob");
    }

    function test_AddCandidate_EmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit Voting.CandidateAdded(0, "Alice");
        voting.addCandidate("Alice");
    }

    function test_AddCandidate_RevertIf_NotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        voting.addCandidate("Alice");
    }

    function test_AddCandidate_RevertIf_EmptyName() public {
        vm.expectRevert("candidate name cannot be empty");
        voting.addCandidate("");
    }

    // -------------------------------------------------------------------------
    // vote
    // -------------------------------------------------------------------------

    function test_Vote_IncrementsCandidateVoteCount() public {
        voting.addCandidate("Alice");

        vm.prank(alice);
        voting.vote(0);

        Voting.Candidate[] memory candidates = voting.getCandidates();
        assertEq(candidates[0].voteCount, 1);
    }

    function test_Vote_MultipleVoters() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");

        vm.prank(alice);
        voting.vote(0);

        vm.prank(bob);
        voting.vote(0);

        vm.prank(carol);
        voting.vote(1);

        Voting.Candidate[] memory candidates = voting.getCandidates();
        assertEq(candidates[0].voteCount, 2);
        assertEq(candidates[1].voteCount, 1);
    }

    function test_Vote_EmitsEvent() public {
        voting.addCandidate("Alice");

        vm.expectEmit(true, true, false, false);
        emit Voting.VoteCast(alice, 0);

        vm.prank(alice);
        voting.vote(0);
    }

    function test_Vote_RevertIf_AlreadyVoted() public {
        voting.addCandidate("Alice");

        vm.startPrank(alice);
        voting.vote(0);
        vm.expectRevert("address has already voted");
        voting.vote(0);
        vm.stopPrank();
    }

    function test_Vote_RevertIf_InvalidCandidateIndex() public {
        voting.addCandidate("Alice");

        vm.prank(alice);
        vm.expectRevert("invalid candidate index");
        voting.vote(99);
    }

    function test_Vote_RevertIf_NoCandidates() public {
        vm.prank(alice);
        vm.expectRevert("invalid candidate index");
        voting.vote(0);
    }

    // -------------------------------------------------------------------------
    // getCandidates
    // -------------------------------------------------------------------------

    function test_GetCandidates_ReturnsEmptyArrayInitially() public view {
        Voting.Candidate[] memory candidates = voting.getCandidates();
        assertEq(candidates.length, 0);
    }

    function test_GetCandidates_ReturnsAllCandidates() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");
        Voting.Candidate[] memory candidates = voting.getCandidates();
        assertEq(candidates.length, 2);
        assertEq(candidates[0].name, "Alice");
        assertEq(candidates[1].name, "Bob");
    }

    // -------------------------------------------------------------------------
    // getWinner
    // -------------------------------------------------------------------------

    function test_GetWinner_ReturnsCandidateWithMostVotes() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");

        vm.prank(alice);
        voting.vote(1); // Bob

        vm.prank(bob);
        voting.vote(1); // Bob

        vm.prank(carol);
        voting.vote(0); // Alice

        assertEq(voting.getWinner(), "Bob");
    }

    function test_GetWinner_TieResolvesToLowestIndex() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");

        vm.prank(alice);
        voting.vote(0); // Alice

        vm.prank(bob);
        voting.vote(1); // Bob

        // Both have 1 vote — Alice (index 0) should win
        assertEq(voting.getWinner(), "Alice");
    }

    function test_GetWinner_RevertIf_NoCandidates() public {
        vm.expectRevert("No candidates registered yet");
        voting.getWinner();
    }

    function test_GetWinner_RevertIf_NoVotesCast() public {
        voting.addCandidate("Alice");
        voting.addCandidate("Bob");

        vm.expectRevert("No votes have been cast yet");
        voting.getWinner();
    }

    // -------------------------------------------------------------------------
    // ownership
    // -------------------------------------------------------------------------

    function test_Owner_IsSetToDeployer() public view {
        assertEq(voting.owner(), owner);
    }
}

