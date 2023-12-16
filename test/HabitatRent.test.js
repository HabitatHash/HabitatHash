const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('HabitatRent', function () {

  // Utility function for deploying the contract
  async function deployRentalContractFixture() {
    [landlord, renter, other] = await ethers.getSigners();

    // Deploy HabitatHub
    const HabitatHubContract = await ethers.getContractFactory('HabitatHub');
    const HabitatHub = await HabitatHubContract.deploy();

    // Add an object and rent it
    await HabitatHub.addObject('Beckombergavägen 15', 50, 3, 56, true);
    const objectIds = await HabitatHub.getAllObjectIds();
    await HabitatHub.connect(renter).rentObject(objectIds[0], 2);
    const rentalObject = await HabitatHub.getRentalObject(objectIds[0]);

    // Get the address of the rental contract
    const rentalContractAddress = rentalObject.contractAddress;
    console.log("Rental Contract Address:", rentalContractAddress);

    // Create a new instance of the HabitatRent contract
    const HabitatRentContract = await ethers.getContractFactory('HabitatRent');
    const rentalContractInstance = HabitatRentContract.attach(rentalContractAddress);

    // Ensure that the contract is deployed and has a valid address
    if (!rentalContractInstance.target) {
       throw new Error("Contract deployment failed");
    }

    return { landlord, renter, other, rentalContract: rentalContractInstance, HabitatHub };
}

  describe('Deployment', function () {
    it('Should set the right landlord', async function () {
      const { rentalContract, landlord } = await loadFixture(
        deployRentalContractFixture
      );
      expect(await rentalContract.landlord()).to.equal(landlord.address);
    });

    it('Should set the correct renter', async function () {
      const {rentalContract, renter} = await loadFixture(
        deployRentalContractFixture
      );
      expect(await rentalContract.renter()).to.equal(renter.address);
    });

    it('Should set the correct months to rent', async function () {
      const {rentalContract} = await loadFixture(
        deployRentalContractFixture
      );

      const monthsToRent = await rentalContract.getMonthsToRent();
      expect(monthsToRent).to.equal(2);
    })

    it('Should set the correct monthly rent', async function () {
      const {rentalContract, HabitatHub} = await loadFixture(
        deployRentalContractFixture
      );

      const rentInWei = await HabitatHub.getUsdToWei(50);

      const monthlyRent = await rentalContract.getMontlyRent();
      expect(monthlyRent).to.equal(rentInWei);
    });
  });

  describe('Rent Payments', function () {
    it('Should allow the renter to pay rent', async function () {
      const { rentalContract, renter, HabitatHub } = await loadFixture(
        deployRentalContractFixture
      );
      const rentInWei = await HabitatHub.getUsdToWei(50);
      const rentWitoutInsurance = rentInWei - ((rentInWei * BigInt(2)) / BigInt(100));

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
        .payRent({ value: rentInWei });
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
      expect(rentAmountLender).to.equal(rentWitoutInsurance);
    });

    it('Should not allow the landlord to pay rent', async function () {
      const { rentalContract, renter, landlord, HabitatHub } = await loadFixture(
        deployRentalContractFixture
      );

      const rentInWei = await HabitatHub.getUsdToWei(50);

      await expect( rentalContract
        .connect(landlord)
        .payRent({ value: rentInWei })).to.be.revertedWith("Only the renter can pay the rent");
    });

    it('Should not allow the renter to pay the wrong amount', async function() {
      const { rentalContract, landlord, HabitatHub } = await loadFixture(
        deployRentalContractFixture
      );
      
      const rentInWei = await HabitatHub.getUsdToWei(20);

      await expect(rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })).to.be.revertedWith("Incorrect rent amount");
    });

    it('Should not allow the renter to pay rent if all payments are already made', async function() {
      const { rentalContract, landlord, HabitatHub } = await loadFixture(
        deployRentalContractFixture
      );

      const rentInWei = await HabitatHub.getUsdToWei(50);

      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      await expect(rentalContract
        .connect(landlord)
        .payRent({ value: rentInWei })).to.be.revertedWith("You have already paid all rents");
    });

    it('Should not allow renter to pay rent if contract is already terminated', async function() {
      const { renter, rentalContract, HabitatHub } = await loadFixture(
        deployRentalContractFixture
      );

      const rentInWei = await HabitatHub.getUsdToWei(50);

      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      await rentalContract.connect(renter).terminateContract();

      await expect(rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })).to.be.revertedWith("Contract is already terminated")

    });

    it('Check that all payments are fulfilled', async function() {
      const { rentalContract, HabitatHub } = await loadFixture(
        deployRentalContractFixture
      );

      const rentInWei = await HabitatHub.getUsdToWei(50);

      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      expect(await rentalContract
        .checkFulfilled()).to.equal(true);
    });

    // Add more tests related to rent payments here
  });

  describe('Contract termination', function () {
    it('Should not be possible to terminate contract without paying all rents', async function () {
      const { rentalContract, renter } = await loadFixture(
        deployRentalContractFixture
      );

      await expect(
        rentalContract.connect(renter).terminateContract()
      ).to.be.revertedWith('All rents are not paid');

    });

    it('Should not be possible to terminate contract if not landlord or renter', async function () {
      const { rentalContract, renter, other, HabitatHub } = await loadFixture(
        deployRentalContractFixture
      );

      const rentInWei = await HabitatHub.getUsdToWei(50);

      // Execute payRent transaction
      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      await expect(
        rentalContract.connect(other).terminateContract()
      ).to.be.revertedWith("Only landlord or renter can terminate the contract");
    });

    it('Should be possible to terminate contract if all rents are paid', async function () {
      const { rentalContract, renter, HabitatHub } = await loadFixture(
        deployRentalContractFixture
      );

      const rentInWei = await HabitatHub.getUsdToWei(50);

      // Execute payRent transaction
      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      await rentalContract
        .connect(renter)
        .payRent({ value: rentInWei })

      expect( await
        rentalContract.terminateContract()
      ).to.be.revertedWith("All rents are not paid");
    });
  })

  // Additional tests for other functions and scenarios
});
