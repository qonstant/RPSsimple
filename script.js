const contractAddress = "0x8e77d0e30ae0fC5e328FF41eF9eeE7f3B13C8869";
const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "outcome",
        type: "uint256",
      },
    ],
    name: "GetGameOutcome",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Received",
    type: "event",
  },
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "fundContract",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "gameOutcomes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLast5Outcomes",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMsgSender",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "playerAddress",
        type: "address",
      },
    ],
    name: "getPlayerBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_playerOneChoice",
        type: "string",
      },
      {
        internalType: "string",
        name: "_playerTwoChoice",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_gameStake",
        type: "uint256",
      },
    ],
    name: "playGame",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "playerBalances",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;
let contract;

// Initialize the contract
provider.send("eth_requestAccounts", []).then(() => {
  provider.listAccounts().then((accounts) => {
    signer = provider.getSigner(accounts[0]);
    contract = new ethers.Contract(contractAddress, abi, signer);
  });
});

// Helper function to get a random choice
function getRandomChoice() {
  const choices = ["rock", "paper", "scissors"];
  const randomIndex = Math.floor(Math.random() * choices.length);
  return choices[randomIndex];
}

// Play the game
async function playGame() {
  const choice = document.getElementById("choice").value; // Player 1's choice
  const stake = document.getElementById("stake").value;

  const playerTwoChoice = getRandomChoice(); // Generate random choice for Player 2
  console.log("Player 2's Random Choice:", playerTwoChoice);

  try {
    const gameStake = ethers.utils.parseEther(stake);

    const tx = await contract.playGame(choice, playerTwoChoice, gameStake);
    await tx.wait();
    alert("Game played successfully!");
    getOutcome();
  } catch (err) {
    console.error("Error:", err);
  }
}

// Deposit funds
async function deposit() {
  const amount = document.getElementById("fund").value;
  try {
    const gasEstimate = await contract.estimateGas.deposit({
      value: ethers.utils.parseEther(amount),
    });

    console.log("Gas Estimate for Deposit:", gasEstimate.toString());

    const tx = await contract.deposit({
      value: ethers.utils.parseEther(amount),
      gasLimit: gasEstimate,
    });
    await tx.wait();
    alert("Funds deposited successfully!");
    getBalances();
  } catch (err) {
    console.error(err);
  }
}

// Withdraw funds
async function withdraw() {
  try {
    const gasEstimate = await contract.estimateGas.withdraw();

    console.log("Gas Estimate for Withdraw:", gasEstimate.toString());

    const tx = await contract.withdraw({ gasLimit: gasEstimate });
    await tx.wait();
    alert("Funds withdrawn successfully!");
    getBalances();
  } catch (err) {
    console.error(err);
  }
}

// Get balances
async function getBalances() {
  try {
    const playerBalance = await contract.getPlayerBalance(
      await signer.getAddress()
    );
    const contractBalance = await contract.getContractBalance();

    console.log(
      "Player Balance (ETH):",
      ethers.utils.formatEther(playerBalance)
    );
    console.log(
      "Contract Balance (ETH):",
      ethers.utils.formatEther(contractBalance)
    );

    document.getElementById("playerBalance").innerText =
      ethers.utils.formatEther(playerBalance);
    document.getElementById("contractBalance").innerText =
      ethers.utils.formatEther(contractBalance);
  } catch (err) {
    console.error(err);
  }
}

// Get game outcome and display history
async function getOutcome() {
  try {
    // Listen for the event and get the outcome
    contract.once("GetGameOutcome", async (outcome) => {
      const outcomeValue = outcome.toNumber(); // Convert BigNumber to number
      let resultMessage = "";

      switch (outcomeValue) {
        case 0:
          resultMessage = "It's a draw!";
          break;
        case 1:
          resultMessage = "You won!";
          break;
        case 2:
          resultMessage = "You lost!";
          break;
        default:
          resultMessage = `Unknown outcome: ${outcomeValue}`;
      }

      // Show outcome
      document.getElementById("outcome").innerText = resultMessage;

      // Save the outcome history
      saveGameHistory(resultMessage);
    });
  } catch (err) {
    console.error("Error fetching outcome:", err);
  }
}

// Fetch and display the last 5 game outcomes
async function fetchGameHistory() {
  try {
    const history = await contract.getLast5Outcomes();
    const historyList = document.getElementById("gameHistory");
    historyList.innerHTML = ''; // Clear existing history

    history.forEach((outcome) => {
      let resultMessage = "";
      switch (outcome.toNumber()) {
        case 0:
          resultMessage = "It's a draw!";
          break;
        case 1:
          resultMessage = "You won!";
          break;
        case 2:
          resultMessage = "You lost!";
          break;
        default:
          resultMessage = `Unknown outcome: ${outcome}`;
      }

      const li = document.createElement("li");
      li.textContent = resultMessage;
      historyList.appendChild(li);
    });
  } catch (err) {
    console.error("Error fetching game history:", err);
  }
}

// Save game history locally
let gameHistory = [];

function saveGameHistory(result) {
  if (gameHistory.length >= 5) {
    gameHistory.shift(); // Remove oldest game result
  }
  gameHistory.push(result);

  const historyList = document.getElementById("gameHistory");
  historyList.innerHTML = ''; // Clear existing history

  gameHistory.forEach((gameResult) => {
    const li = document.createElement("li");
    li.textContent = gameResult;
    historyList.appendChild(li);
  });
}

// Periodically update the outcome every 5 seconds
function startPeriodicOutcomeUpdate() {
  setInterval(async () => {
    try {
      const outcome = await contract.gameOutcomes(0);  // Assuming the latest outcome is at index 0
      let resultMessage = "";

      switch (outcome.toNumber()) {
        case 0:
          resultMessage = "It's a draw!";
          break;
        case 1:
          resultMessage = "You won!";
          break;
        case 2:
          resultMessage = "You lost!";
          break;
        default:
          resultMessage = `Unknown outcome: ${outcome}`;
      }

      // Show the most recent outcome
      document.getElementById("outcome").innerText = resultMessage;
    } catch (err) {
      console.error("Error updating outcome:", err);
    }
  }, 5000); // Update every 5 seconds
}

// Call the function to start the periodic updates
startPeriodicOutcomeUpdate();
