// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "solady/src/utils/Base64.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import
    "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract XTalkGateway {
    struct VoteInfo {
        uint256 count;
        mapping(address => bool) hasVoted;
    }

    uint256 constant SIGNATURE_LENGTH = 65;
    // State variables

    mapping(address => uint256) public signer_transaction;
    mapping(address => bool) public isAuthorized;
    address[] public authorized_signers;
    mapping(address => VoteInfo) private pending_authorized_signers;
    mapping(address => VoteInfo) private pending_removal_signers;

    event ConsensusReached(bytes32);
    event AddVoteCasted(address, address);
    event RemoveVoteCasted(address, address);
    event SignerAdded(address);
    event SignerRemoved(address);

    event EmptyParameters(bytes32, bytes);
    event ConsensusNotReached(bytes[] indexed);
    event FailedCrossContractCall(address, bytes);
    event NotAuthorized(address indexed);
    event NotSortedAndUnique(bytes[] indexed);
    event EventData(address indexed, bytes indexed);
    event DifferentLength();

    // Modifiers
    modifier onlyAuthorized() {
        require(isAuthorized[msg.sender], "Not authorized");
        _;
    }

    // Constructor
    constructor(address[] memory initialSigners) {
        for (uint256 i = 0; i < initialSigners.length; i++) {
            require(initialSigners[i] != address(0), "Invalid initial address");
            authorized_signers.push(initialSigners[i]);
            isAuthorized[initialSigners[i]] = true;
            emit SignerAdded(initialSigners[i]);
        }
        isAuthorized[msg.sender] = true;
        authorized_signers.push(msg.sender);
    }

    // getters and setters
    function getAllAuthorizedSigners()
        public
        view
        returns (address[] memory)
    {
        return authorized_signers;
    }

    function getPendingAuthorizedSigners(address signer_address)
        public
        view
        returns (uint256)
    {
        return pending_authorized_signers[signer_address].count;
    }

    function getPendingRemovalSigners(address signer_address)
        public
        view
        returns (uint256)
    {
        return pending_removal_signers[signer_address].count;
    }

    // logic functions

    function addAuthorizedSigner(address signer_address)
        public
        onlyAuthorized
    {
        if (pending_authorized_signers[signer_address].hasVoted[msg.sender]) {
            revert("Already voted");
        }
        pending_authorized_signers[signer_address].count++;
        pending_authorized_signers[signer_address].hasVoted[msg.sender] = true;
        emit AddVoteCasted(msg.sender, signer_address);
        if (isMajorityReached(signer_address)) {
            authorized_signers.push(signer_address);
            isAuthorized[signer_address] = true;
            delete pending_authorized_signers[signer_address];
            emit SignerAdded(signer_address);
        }
    }

    function removeAuthorizedSigner(address signer_address)
        public
        onlyAuthorized
    {
        if (pending_removal_signers[signer_address].hasVoted[msg.sender]) {
            revert("Already voted");
        }
        pending_removal_signers[signer_address].count++;
        pending_removal_signers[signer_address].hasVoted[msg.sender] = true;
        emit RemoveVoteCasted(msg.sender, signer_address);
        if (isRemovalMajorityReached(signer_address)) {
            removeAddressFromArray(signer_address);
            delete pending_removal_signers[signer_address];
            delete isAuthorized[signer_address];
            emit SignerRemoved(signer_address);
        }
    }

    function quitNetwork() public onlyAuthorized {
        removeAddressFromArray(msg.sender);
        delete isAuthorized[msg.sender];
        emit SignerRemoved(msg.sender);
    }

    function entrypoint(
        bytes32 global_tx_id,
        bytes memory event_data,
        address contract_address,
        bytes[] memory signatures
    ) public {
        if (global_tx_id.length == 0 || event_data.length == 0) {
            emit EmptyParameters(global_tx_id, event_data);
            return;
        }
        if (!isAuthorized[msg.sender]) {
            emit NotAuthorized(msg.sender);
            return;
        }
        // require(isSortedAndUnique(signatures));
        if (!isSortedAndUnique(signatures)) {
            emit NotSortedAndUnique(signatures);
            return;
        }

        uint256 validSignatures = 0;

        bytes32 hash = keccak256(event_data);

        for (uint256 i = 0; i < signatures.length; i++) {
            address recovered = ECDSA.recover(hash, signatures[i]);
            if (isAuthorized[recovered]) {
                validSignatures++;
            }
        }

        // // Check if consensus is reached
        if (validSignatures <= (authorized_signers.length / 2)) {
            emit ConsensusNotReached(signatures);
            return;
        }

        (bool success,) = contract_address.call(event_data);
        if (!success) {
            emit FailedCrossContractCall(contract_address, event_data);
            return;
        }

        signer_transaction[msg.sender]++;
        emit ConsensusReached(hash);
    }

    function directCall(bytes memory event_data, address contract_address)
        public
        returns (bool)
    {
        (bool success,) = contract_address.call(event_data);
        return success;
    }

    function getTotalTransactionsForSigner(address signer_address)
        public
        view
        onlyAuthorized
        returns (uint256)
    {
        return signer_transaction[signer_address];
    }

    // Private functions
    function isMajorityReached(address new_signer)
        private
        view
        returns (bool)
    {
        return getPendingAuthorizedSigners(new_signer)
            >= (authorized_signers.length / 2 + 1);
    }

    function isRemovalMajorityReached(address new_signer)
        private
        view
        returns (bool)
    {
        return getPendingRemovalSigners(new_signer)
            >= (authorized_signers.length / 2 + 1);
    }

    function removeAddressFromArray(address addr) private {
        for (uint256 i = 0; i < authorized_signers.length; i++) {
            if (authorized_signers[i] == addr) {
                authorized_signers[i] =
                    authorized_signers[authorized_signers.length - 1];
                authorized_signers.pop();
                break;
            }
        }
    }

    function recoverSigner(bytes memory data, bytes memory signature)
        public
        pure
        returns (address)
    {
        bytes32 hash_data = keccak256(data);
        bytes32 signed_msg = MessageHashUtils.toEthSignedMessageHash(hash_data);

        address recovered = ECDSA.recover(signed_msg, signature);
        return recovered;
    }

    function getPayloadHash(bytes memory payload)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(payload));
    }

    function isSortedAndUnique(bytes[] memory signatures)
        internal
        pure
        returns (bool)
    {
        if (signatures[0].length != SIGNATURE_LENGTH) {
            return false;
        }
        for (uint256 i = 1; i < signatures.length; i++) {
            if (signatures[i].length != SIGNATURE_LENGTH) {
                return false;
            }
            if (!isLessThan(signatures[i - 1], signatures[i])) {
                return false;
            }
            if (keccak256(signatures[i - 1]) == keccak256(signatures[i])) {
                return false;
            }
        }
        return true;
    }

    function isLessThan(bytes memory a, bytes memory b)
        internal
        pure
        returns (bool)
    {
        for (uint256 i = 0; i < a.length; i++) {
            if (a[i] < b[i]) {
                return true;
            } else if (a[i] > b[i]) {
                return false;
            }
        }

        return false;
    }
}
