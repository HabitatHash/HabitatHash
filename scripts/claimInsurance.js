const hre = require('hardhat');
const { HUB_ADDRESS, RENT_ADDRESS, VOTE_ADDRESS } = require('./constants');

async function main() {
  try {
    // Get the ContractFactory of your SimpleContract
    const HabitatHub = await hre.ethers.getContractFactory('HabitatHub');
    const HabitatVote = await hre.ethers.getContractFactory('HabitatVote');

    const voteContractAddress = VOTE_ADDRESS;
    const voteContract = HabitatVote.attach(voteContractAddress);

    // Connect to the deployed contract
    const contractAddress = HUB_ADDRESS;
    const rentContractAddress = RENT_ADDRESS;
    const contract = HabitatHub.attach(contractAddress);
    const [addr1] = await hre.ethers.getSigners();

    await contract.connect(addr1).claimInsurance(rentContractAddress);

    const insuranceCase = await voteContract.getCase();
    const claimedInsurance = insuranceCase[2];

    console.log(`${claimedInsurance} Wei claimed by: ${addr1.address}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
