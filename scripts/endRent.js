const hre = require('hardhat');
const { HUB_ADDRESS, RENT_ADDRESS } = require('./constants');

async function main() {
  try {
    const HabitatRent = await hre.ethers.getContractFactory('HabitatRent');

    // Connect to the deployed contract
    const contractAddress = RENT_ADDRESS;
    const contract = HabitatRent.attach(contractAddress);
    const [addr1] = await hre.ethers.getSigners();

    await contract.connect(addr1).terminateContract();

    console.log('Terminated contract, object is ready to be rented again!');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
