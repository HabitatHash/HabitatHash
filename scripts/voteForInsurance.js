const hre = require('hardhat');
const { HUB_ADDRESS, RENT_ADDRESS, VOTE_ADDRESS } = require('./constants');

async function main() {
  try {
    const HabitatVote = await hre.ethers.getContractFactory('HabitatVote');

    // Connect to the deployed contract
    const contractAddress = VOTE_ADDRESS;
    const contract = HabitatVote.attach(contractAddress);
    const [
      addr1,
      addr2,
      addr3,
      addr4,
      addr5,
      addr6,
      addr7,
      addr8,
      addr9,
      addr10,
      addr11,
      addr12,
    ] = await hre.ethers.getSigners();

    await contract.connect(addr2).vote(true);
    console.log(`${addr2.address} voted: ${true}`);

    await contract.connect(addr3).vote(true);
    console.log(`${addr3.address} voted: ${true}`);

    await contract.connect(addr4).vote(false);
    console.log(`${addr4.address} voted: ${false}`);

    await contract.connect(addr5).vote(false);
    console.log(`${addr5.address} voted: ${false}`);

    await contract.connect(addr6).vote(true);
    console.log(`${addr6.address} voted: ${true}`);

    await contract.connect(addr7).vote(true);
    console.log(`${addr7.address} voted: ${true}`);

    await contract.connect(addr8).vote(true);
    console.log(`${addr8.address} voted: ${true}`);

    await contract.connect(addr9).vote(true);
    console.log(`${addr9.address} voted: ${true}`);

    await contract.connect(addr10).vote(true);
    console.log(`${addr10.address} voted: ${true}`);

    await contract.connect(addr11).vote(true);
    console.log(`${addr11.address} voted: ${true}`);

    await contract.connect(addr12).vote(false);
    console.log(`${addr12.address} voted: ${false}`);

    const result = await contract.getResult();

    console.log(`Final result: Should be able to recieve insurance: ${result}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
