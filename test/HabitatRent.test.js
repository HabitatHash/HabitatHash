const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('HabitatRent', function () {
  let RentalContract;
  let rentalContract;
  let landlord, renter;

  // Utility function for deploying the contract
  async function deployRentalContractFixture() {
    [landlord, renter] = await ethers.getSigners();

    HabitatHubContract = await ethers.getContractFactory('HabitatHub');
    HabitatHub = await HabitatHubContract.deploy();

    txResponse = await HabitatHub.addObject(
      'Beckombergavägen 15',
      1000,
      3,
      56,
      true
    );

    RentalContract = await ethers.getContractFactory('HabitatRent');
    rentalContract = await RentalContract.deploy(
      HabitatHub.target,
      landlord.address,
      renter.address,
      100,
      12, //Months
      ethers.parseEther('1.0') // 1 Ether as monthly rent
    );

    //Ensure that the contract is deployed and has a valid address
    // if (!rentalContract.address) {
    //    throw new Error("Contract deployment failed");
    // }

    return { landlord, renter, rentalContract };
  }

  describe('Deployment', function () {
    it('Should set the right landlord', async function () {
      const { rentalContract, landlord } = await loadFixture(
        deployRentalContractFixture
      );
      expect(await rentalContract.landlord()).to.equal(landlord.address);
    });

    // Add more deployment-related tests here
  });

  describe('Rent Payments', function () {
    it('Should allow the renter to pay rent', async function () {
      const { rentalContract, renter } = await loadFixture(
        deployRentalContractFixture
      );

      const renterAddress = await rentalContract.renter();
      const lenderAddress = await rentalContract.landlord();

      // Check initial balance of the contract
      const initialBalanceRenter = await ethers.provider.getBalance(
        renterAddress
      );
      const initialBalanceLender = await ethers.provider.getBalance(
        lenderAddress
      );

      // Execute payRent transaction
      const tx = await rentalContract
        .connect(renter)
        .payRent({ value: ethers.parseEther('1.0') });
      await tx.wait(); // Wait for the transaction to be mined

      // Check final balance of the contract
      const finalBalanceRenter = await ethers.provider.getBalance(
        renterAddress
      );
      const finalBalanceLender = await ethers.provider.getBalance(
        lenderAddress
      );

      const rentAmountLender = finalBalanceLender - initialBalanceLender;
      const rentAmountRenter = initialBalanceRenter - finalBalanceRenter;

      // Assert that the contract's balance increased by the rent amount
      expect(rentAmountLender).to.equal(ethers.parseEther('1.0'));
    });

    // Add more tests related to rent payments here
  });

  // Additional tests for other functions and scenarios
});
