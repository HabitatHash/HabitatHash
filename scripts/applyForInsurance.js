const hre = require('hardhat');
const { HUB_ADDRESS, RENT_ADDRESS } = require('./constants');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getDescription() {
  return new Promise((resolve, reject) => {
    rl.question('Whats the reason you apply for insurance? ', (answer) => {
      resolve(answer);
    });
  });
}
function getValue() {
  return new Promise((resolve, reject) => {
    rl.question('How much do you want to claim (USD)? ', (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const description = await getDescription();
    const value = await getValue();

    const HabitatHub = await hre.ethers.getContractFactory('HabitatHub');

    // Connect to the deployed contract
    const contractAddress = HUB_ADDRESS;
    const rentContractAddress = RENT_ADDRESS;
    const contract = HabitatHub.attach(contractAddress);
    const [addr1] = await hre.ethers.getSigners();

    await contract
      .connect(addr1)
      .applyForInsurance(rentContractAddress, description, value);

    const rentalContract = await contract.rentalContracts(rentContractAddress);
    const insuranceContractAddress = rentalContract[1];

    console.log('Insurance contract:', insuranceContractAddress);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
