require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// Go to https://infura.io, sign up, create a new API key
// in its dashboard, and replace "KEY" with it
const INFURA_API_KEY = process.env.INFURA_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  allowUnlimitedContractSize: true,
  networks: {
    hardhat: {
      forking: {
        url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
        // Optionally, you can specify a block number to fork from
        // blockNumber: <block_number>
      }
    }
  }
};