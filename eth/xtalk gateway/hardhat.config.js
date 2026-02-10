require("@nomicfoundation/hardhat-toolbox");


const INFURA_API_KEY = "904a9154641d44348e7fab88570219e9";
const PRIVATE_KEY = "3c847c8759f82432084604228099e7b0b1270d296109ecf64a1497ea7f11bdca"; // 0x17e66991ac9be7599ec66c08e3b2d63254458549

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 5000,
      },
      viaIR: true,
    },
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: [PRIVATE_KEY],
    },
    optimistic: {
      url: `https://optimism-goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    devnet: {
      url: "http://localhost:8545",
      accounts: [PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: "X6K857FHFMS7CWHPG2X2AD3I2KBCHQP3ME",
      goerli: "CNQMU2ZM1T1CBI1IY79A1EKJFIBMU8JB8M",
      optimisticGoerli: "C4YIC217NXH3EYNV1U4TNBBKWYIE1Q1E8D",
    },
    // url: "https://api-testnet.bscscan.com/",
    url: "https://api-goerli.etherscan.io/",
    // url: "https://api-goerli-optimistic.etherscan.io/"
  }
};
