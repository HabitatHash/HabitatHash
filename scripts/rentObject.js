const hre = require('hardhat');
const { HUB_ADDRESS } = require('./constants');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getObjectId() {
  return new Promise((resolve, reject) => {
    rl.question('Which object ID? ', (answer) => {
      resolve(answer);
    });
  });
}
function getMonthsToRent() {
  return new Promise((resolve, reject) => {
    rl.question(
      'How many months do you want to rent the apartment? ',
      (answer) => {
        resolve(answer);
      }
    );
  });
}

async function main() {
  try {
    // Get the ContractFactory of your SimpleContract
    const HabitatHub = await hre.ethers.getContractFactory('HabitatHub');

    // Connect to the deployed contract
    const contractAddress = HUB_ADDRESS;
    const contract = HabitatHub.attach(contractAddress);
    const [addr1, addr2] = await hre.ethers.getSigners();

    const objectId = BigInt(await getObjectId());
    const monthsToRent = Number(await getMonthsToRent());

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalObjectAddress = rentalObject[3];

    console.log('Rent contract address:', rentalObjectAddress);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
