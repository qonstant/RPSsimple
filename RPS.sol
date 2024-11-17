// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/security/ReentrancyGuard.sol";

// For testing/learning purposes only -- not production code
contract RPSv1 is ReentrancyGuard {
    mapping(address => uint) public playerBalances;

    event Received(address indexed sender, uint amount);
    event GetGameOutcome(uint outcome);

    // Give the contract something to bet with
    function fundContract() external payable {
        emit Received(msg.sender, msg.value);
    }

    // Deposit a player's funds
    function deposit() external payable {
        playerBalances[msg.sender] += msg.value;
    }

    // Withdraw a player's funds
    function withdraw() external nonReentrant {
        uint playerBalance = playerBalances[msg.sender];
        require(playerBalance > 0, "Insufficient balance to withdraw");

        playerBalances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: playerBalance}("");
        require(success, "Withdraw failed");
    }

    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }

    function getPlayerBalance(address playerAddress) external view returns (uint) {
        return playerBalances[playerAddress];
    }

    function getMsgSender() external view returns (address) {
        return msg.sender;
    }

    function playGame(
        string calldata _playerOneChoice,
        string calldata _playerTwoChoice,
        uint _gameStake
    ) external returns (uint) {
        require(
            playerBalances[msg.sender] >= _gameStake,
            "Insufficient funds for the bet"
        );

        bytes memory b = bytes.concat(bytes(_playerOneChoice), bytes(_playerTwoChoice));
        uint rslt;

        if (
            keccak256(b) == keccak256(bytes("rockrock")) ||
            keccak256(b) == keccak256(bytes("paperpaper")) ||
            keccak256(b) == keccak256(bytes("scissorsscissors"))
        ) {
            rslt = 0; // Draw
        } else if (
            keccak256(b) == keccak256(bytes("scissorspaper")) ||
            keccak256(b) == keccak256(bytes("rockscissors")) ||
            keccak256(b) == keccak256(bytes("paperrock"))
        ) {
            playerBalances[msg.sender] += _gameStake * 1 ether; // Player 1 wins
            rslt = 1;
        } else if (
            keccak256(b) == keccak256(bytes("paperscissors")) ||
            keccak256(b) == keccak256(bytes("scissorsrock")) ||
            keccak256(b) == keccak256(bytes("rockpaper"))
        ) {
            playerBalances[msg.sender] -= _gameStake * 1 ether; // Player 2 wins
            rslt = 2;
        } else {
            rslt = 3; // Invalid game
        }

        emit GetGameOutcome(rslt);
        return rslt;
    }
}
