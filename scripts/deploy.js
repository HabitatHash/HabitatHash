// scripts/deploy.js

const hre = require("hardhat");

async function main() {
    const habitatHub = await hre.ethers.deployContract("HabitatHub");
    await habitatHub.waitForDeployment();

    console.log("HabitatHub deployed to:", habitatHub.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
