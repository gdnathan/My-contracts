// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Voting - A simple voting smart contract
/// @notice Only the owner can add candidates. Each address can vote only once.
contract Voting is Ownable, ReentrancyGuard {
    struct Candidate {
        string name;
        uint voteCount;
    }
    Candidate[] private candidates;

    /// @dev Tracks whether an address has already voted
    mapping(address => bool) private hasVoted;

    event CandidateAdded(uint indexed candidateIndex, string name);
    event VoteCast(address indexed voter, uint indexed candidateIndex);

    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "address has already voted");
        _;
    }

    modifier validCandidateIndex(uint candidateIndex) {
        require(candidateIndex < candidates.length, "invalid candidate index");
        _;
    }

    constructor() Ownable (msg.sender) {}

    /// @notice Add a new candidate to the election
    /// @param name The name of the candidate to add
    function addCandidate(string memory name) external onlyOwner {
        require(bytes(name).length > 0, "candidate name cannot be empty");
        uint index = candidates.length;
        candidates.push(Candidate({ name: name, voteCount: 0 }));
        emit CandidateAdded(index, name);
    }

    /// @notice Cast a vote for a candidate by index
    /// @param candidateIndex The index of the candidate in the candidates array
    function vote(uint candidateIndex)
        external
        hasNotVoted
        validCandidateIndex(candidateIndex)
    {
        hasVoted[msg.sender] = true;
        candidates[candidateIndex].voteCount += 1;
        emit VoteCast(msg.sender, candidateIndex);
    }

    /// @notice Retrieve all candidates and their current vote counts
    /// @return An array of Candidate structs
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /// @notice Declare the winner (candidate with the most votes)
    /// @dev Reverts if no candidates exist or if no votes have been cast.
    ///      In case of a tie, returns the candidate with the lowest index.
    /// @return name The name of the winning candidate
    function getWinner() external view returns (string memory name) {
        require(candidates.length > 0, "No candidates registered yet");

        uint winningVoteCount = 0;
        uint winningIndex = 0;
        bool anyVoteCast = false;

        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningIndex = i;
                anyVoteCast = true;
            }
        }

        require(anyVoteCast, "No votes have been cast yet");
        return candidates[winningIndex].name;
    }
}

