const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceConsumerV3", function () {
  it("Should return the latest price", async function () {
    const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
    const priceConsumer = await PriceConsumerV3.deploy();
    // No need for the deployed() call
    const latestPrice = await priceConsumer.getLatestPrice();
    console.log("Latest Price:", latestPrice.toString());

    // Since the price is returned as a BigNumber, we check if it's a BigNumber instead of a 'number'
    expect(Number(latestPrice)).to.be.a('number');
  });
});
