const hre = require('hardhat');
const { HUB_ADDRESS, RENT_ADDRESS } = require('./constants');

async function main() {
  try {
    const HabitatRent = await hre.ethers.getContractFactory('HabitatRent');

    // Connect to the deployed contract
    const contractAddress = RENT_ADDRESS;
    const contract = HabitatRent.attach(contractAddress);
    const [addr1, addr2] = await hre.ethers.getSigners();

    const monthlyRent = await contract.getMontlyRent();

    await contract.connect(addr2).payRent({ value: monthlyRent });

    console.log(`Paid: ${monthlyRent} Wei`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
