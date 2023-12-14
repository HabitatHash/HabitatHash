const { expect } = require('chai');
const {
  loadFixture,
} = require('@nomicfoundation/hardhat-toolbox/network-helpers');

describe('HabitatHub', async function () {
  async function deployContractFixture() {
    const [addr1, addr2] = await ethers.getSigners();

    const contract = await ethers.deployContract('HabitatHub');

    return { contract, addr1, addr2 };
  }

  it('Deployment should assign empty objectIds', async function () {
    const { contract } = await loadFixture(deployContractFixture);

    const objectIds = await contract.getAllObjectIds();

    expect(objectIds.length).to.equal(0);
  });

  it('Should be able to add object', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    const objectIds = await contract.getAllObjectIds();

    expect(objectIds.length).to.equal(1);
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

  it('Should be able to remove object', async function () {
    const { contract, addr1 } = await loadFixture(deployContractFixture);

    await contract
      .connect(addr1)
      .addObject('Beckombergavägen 15', 1000, 3, 56, true);

    let objectIds = await contract.getAllObjectIds();

    await contract.connect(addr1).removeObject(objectIds[0]);

    objectIds = await contract.getAllObjectIds();

    expect(objectIds.length).to.equal(0);
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
});
