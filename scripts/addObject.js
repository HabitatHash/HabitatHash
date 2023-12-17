const hre = require('hardhat');
const { HUB_ADDRESS } = require('./constants');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getAddress() {
  return new Promise((resolve, reject) => {
    rl.question('Whats your address and/or aparment? ', (answer) => {
      resolve(answer);
    });
  });
}
function getRent() {
  return new Promise((resolve, reject) => {
    rl.question(
      'How much do you want to take out in rent (USD)? ',
      (answer) => {
        resolve(answer);
      }
    );
  });
}
function getNumberOfRooms() {
  return new Promise((resolve, reject) => {
    rl.question('How many rooms is the apartment? ', (answer) => {
      resolve(answer);
    });
  });
}
function getSQM() {
  return new Promise((resolve, reject) => {
    rl.question('How many square meters is the apartment? ', (answer) => {
      resolve(answer);
    });
  });
}
function getIsFurnished() {
  return new Promise((resolve, reject) => {
    rl.question('Is the apartment furnished? ', (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const HabitatHub = await hre.ethers.getContractFactory('HabitatHub');

    // Connect to the deployed contract
    const contractAddress = HUB_ADDRESS;
    const contract = HabitatHub.attach(contractAddress);
    const [addr1] = await hre.ethers.getSigners();

    //Add object to HabitatHub
    const objectAddress = await getAddress();
    const rentInUSD = Number(await getRent());
    const numberOfRooms = Number(await getNumberOfRooms());
    const sqm = Number(await getSQM());
    const isFurnished = (await getIsFurnished()) == 'true';

    await contract
      .connect(addr1)
      .addObject(objectAddress, rentInUSD, numberOfRooms, sqm, isFurnished);

    const objectIds = await contract.getAllObjectIds();
    const objectId = objectIds[0];
    console.log('Object ID:', objectId);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
