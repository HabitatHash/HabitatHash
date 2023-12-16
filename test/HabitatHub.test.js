const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  loadFixture,
} = require('@nomicfoundation/hardhat-toolbox/network-helpers');

describe('HabitatHub', async function () {
  async function deployContractFixture() {
    const [addr1, addr2, addr3, addr4, addr5, addr6] =
      await ethers.getSigners();

    const contract = await ethers.deployContract('HabitatHub');

    return { contract, addr1, addr2, addr3, addr4, addr5, addr6 };
  }

  //Test correct deployment
  it('Deployment should assign empty objectIds', async function () {
    const { contract } = await loadFixture(deployContractFixture);

    const objectIds = await contract.getAllObjectIds();

    expect(objectIds.length).to.equal(0);
  });

  //Test usd to eth oracle
  it('Should return the latest price', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);

    const latestPrice = await contract.connect(addr1).getEthToUsd();

    expect(Number(latestPrice)).to.be.a('number');
  });

  it('Should be able to get usdToEth', async function () {
    const { contract } = await loadFixture(deployContractFixture);

    const hundredUsdInWei = Number(await contract.getUsdToWei(1));

    expect(hundredUsdInWei).to.be.a('number');
  });

  // Test add object
  it('Should be able to add object', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);
    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 16', 1000, 3, 56, true);

    const rentalObjects = await contract.getAllRentalObjects();

    expect(rentalObjects.length).to.equal(2);
  });

  it('Should emit AddObject events', async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployContractFixture);

    await expect(
      contract
        .connect(addr1)
        .addObject('Beckombergavägen 15', 1000, 3, 56, true)
    ).to.emit(contract, 'AddObject');
  });

  it('Should fail to add same object twice', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    await expect(
      contract
        .connect(addr1)
        .addObject('Beckombergavägen 15', 1500, 5, 100, true)
    ).to.be.revertedWith('You cannot add multiple of same rental objects');
  });

  //Test remove object
  it('Should be able to remove object', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);
    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 16', 1000, 3, 56, true);

    let objectIds = await contract.getAllObjectIds();

    await contract.connect(addr1).removeObject(objectIds[1]);

    objectIds = await contract.getAllObjectIds();

    expect(objectIds.length).to.equal(1);
  });

  it('Should not be able to remove others object', async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    let objectIds = await contract.getAllObjectIds();

    await expect(
      contract.connect(addr2).removeObject(objectIds[0])
    ).to.be.revertedWith('You can only remove your own objects');
  });
  it('Should not be able to remove rented object', async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 1;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    await expect(
      contract.connect(addr1).removeObject(objectId)
    ).to.be.revertedWith('Object is currently rented out');
  });

  //Test rent
  it('Should be able to rent object, and should not be able to rent already rented object', async function () {
    const { contract, addr1, addr2, addr3 } = await loadFixture(
      deployContractFixture
    );

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 1;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);

    expect(rentalObject.isRented).to.equal(true);

    await expect(
      contract.connect(addr3).rentObject(objectId, monthsToRent)
    ).to.be.revertedWith('Object is already rented');
  });

  it('Should not be able to rent object that doesnt exist', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);

    const objectId = 123;
    const monthsToRent = 1;

    await expect(
      contract.connect(addr1).rentObject(objectId, monthsToRent)
    ).to.be.revertedWith('Object doesnt exist');
  });

  //Test end rent
  it('Should not be able to end rent when object doesnt exist or is not rented', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 1;

    await expect(
      contract.connect(addr1).endRentObject(objectId)
    ).to.be.revertedWith('Object is not rented');
  });

  it('Should not be able to end rent when rent contract is not fulfilled', async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 1;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    await expect(
      contract.connect(addr2).endRentObject(objectId)
    ).to.be.revertedWith('Contract is not fulfilled');
  });
  it('Should be able to end rent when rent contract is fulfilled', async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);
    await contract.connect(addr2).endRentObject(objectId);

    const rentalObject = await contract.getRentalObject(objectId);

    expect(rentalObject.isRented).to.equal(false);
  });

  //Test apply insurance
  it('Should be able to apply for insurance', async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await expect(
      contract
        .connect(addr1)
        .applyForInsurance(rentalContractAddress, 'test', 1)
    ).to.emit(contract, 'InsuranceApplied');
  });
  it('Should not be able to apply for insurance twice on same contract', async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await contract
      .connect(addr1)
      .applyForInsurance(rentalContractAddress, 'test', 1);

    await expect(
      contract
        .connect(addr1)
        .applyForInsurance(rentalContractAddress, 'test', 1)
    ).to.be.revertedWith(
      'You can only create one insurance claim per rental contract'
    );
  });
  it('Should not be able to apply for insurance on others contracts', async function () {
    const { contract, addr1, addr2 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await expect(
      contract
        .connect(addr2)
        .applyForInsurance(rentalContractAddress, 'test', 1)
    ).to.to.be.revertedWith(
      'You can only apply for insurance on your own contract'
    );
  });

  //Test claim insurance
  it('Should not be able to claim insurance when no insurance claim exists', async function () {
    const { contract, addr1, addr2, addr3 } = await loadFixture(
      deployContractFixture
    );

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await expect(
      contract.connect(addr3).claimInsurance(rentalContractAddress)
    ).to.be.revertedWith('No insurance claim on this contract');
  });
  it('Should not be able to claim insurance when no not the owner', async function () {
    const { contract, addr1, addr2, addr3 } = await loadFixture(
      deployContractFixture
    );

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await contract
      .connect(addr1)
      .applyForInsurance(rentalContractAddress, 'test', 1);

    await expect(
      contract.connect(addr3).claimInsurance(rentalContractAddress)
    ).to.be.revertedWith('You dont own that contract');
  });
  it('Should not be able to claim insurance when voted false', async function () {
    const { contract, addr1, addr2, addr3, addr4, addr5, addr6 } =
      await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await contract
      .connect(addr1)
      .applyForInsurance(rentalContractAddress, 'test', 1);

    const insuranceContract = await contract.rentalContracts(
      rentalContractAddress
    );
    const insuranceContractAddress = insuranceContract[1];
    const HabitatVote = await ethers.getContractFactory('HabitatVote');
    const HabitatVoteInstance = HabitatVote.attach(insuranceContractAddress);

    await HabitatVoteInstance.connect(addr2).vote(false);
    await HabitatVoteInstance.connect(addr3).vote(true);
    await HabitatVoteInstance.connect(addr4).vote(false);
    await HabitatVoteInstance.connect(addr5).vote(true);
    await HabitatVoteInstance.connect(addr6).vote(false);

    await expect(
      contract.connect(addr1).claimInsurance(rentalContractAddress)
    ).to.be.revertedWith('It has been voted you should not get insurance');
  });
  it('Should be able to claim insurance when voted true', async function () {
    const { contract, addr1, addr2, addr3, addr4, addr5, addr6 } =
      await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await contract
      .connect(addr1)
      .applyForInsurance(rentalContractAddress, 'test', 0);

    const insuranceContract = await contract.rentalContracts(
      rentalContractAddress
    );
    const insuranceContractAddress = insuranceContract[1];
    const HabitatVote = await ethers.getContractFactory('HabitatVote');
    const HabitatVoteInstance = HabitatVote.attach(insuranceContractAddress);

    await HabitatVoteInstance.connect(addr2).vote(true);
    await HabitatVoteInstance.connect(addr3).vote(true);
    await HabitatVoteInstance.connect(addr4).vote(false);
    await HabitatVoteInstance.connect(addr5).vote(true);
    await HabitatVoteInstance.connect(addr6).vote(false);

    await expect(
      contract.connect(addr1).claimInsurance(rentalContractAddress)
    ).to.emit(contract, 'InsuranceClaimed');
  });
  it('Should not be able to claim insurance when blanace in contract is not enough', async function () {
    const { contract, addr1, addr2, addr3, addr4, addr5, addr6 } =
      await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await contract
      .connect(addr1)
      .applyForInsurance(rentalContractAddress, 'test', 1);

    const insuranceContract = await contract.rentalContracts(
      rentalContractAddress
    );
    const insuranceContractAddress = insuranceContract[1];
    const HabitatVote = await ethers.getContractFactory('HabitatVote');
    const HabitatVoteInstance = HabitatVote.attach(insuranceContractAddress);

    await HabitatVoteInstance.connect(addr2).vote(true);
    await HabitatVoteInstance.connect(addr3).vote(true);
    await HabitatVoteInstance.connect(addr4).vote(false);
    await HabitatVoteInstance.connect(addr5).vote(true);
    await HabitatVoteInstance.connect(addr6).vote(false);

    await expect(
      contract.connect(addr1).claimInsurance(rentalContractAddress)
    ).to.be.revertedWith('Insufficient balance in the contract');
  });
  it('Should not be able to claim insurance twice', async function () {
    const { contract, addr1, addr2, addr3, addr4, addr5, addr6 } =
      await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    const objectId = objectIds[0];
    const monthsToRent = 0;

    await contract.connect(addr2).rentObject(objectId, monthsToRent);

    const rentalObject = await contract.getRentalObject(objectId);
    const rentalContractAddress = rentalObject.contractAddress;

    await contract
      .connect(addr1)
      .applyForInsurance(rentalContractAddress, 'test', 0);

    const insuranceContract = await contract.rentalContracts(
      rentalContractAddress
    );
    const insuranceContractAddress = insuranceContract[1];
    const HabitatVote = await ethers.getContractFactory('HabitatVote');
    const HabitatVoteInstance = HabitatVote.attach(insuranceContractAddress);

    await HabitatVoteInstance.connect(addr2).vote(true);
    await HabitatVoteInstance.connect(addr3).vote(true);
    await HabitatVoteInstance.connect(addr4).vote(false);
    await HabitatVoteInstance.connect(addr5).vote(true);
    await HabitatVoteInstance.connect(addr6).vote(false);

    await contract.connect(addr1).claimInsurance(rentalContractAddress);

    await expect(
      contract.connect(addr1).claimInsurance(rentalContractAddress)
    ).to.be.revertedWith('This insurance has already been claimed');
  });
  /*
  //Test hash function
  it('Should be able to hash address', async function () {
    const { contract } = await loadFixture(deployContractFixture);
    const id = await contract.addressToHashId('testString');
    expect(Number(id)).to.be.a('Number');
  });
  //Test Id exists
  it('Id should not exist', async function () {
    const { contract } = await loadFixture(deployContractFixture);
    const exists = await contract.idExists(123);
    expect(exists).to.equal(false);
  });
  */
  //Test deposit
  it('Should be able to deposit to contract', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);
    await contract.connect(addr1).deposit({ value: BigInt(1) });
  });
});
