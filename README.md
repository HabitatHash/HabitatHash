# HabitatHash

This is a project in the [Programmable Society DD2485](https://github.com/KTH/programmable-society) course.

This project aims to implement smart contracts for the secondary housing rental market. Renting out an apartment involves numerous steps and requires a high degree of trust between the lender (landlord) and the renter. Our goal is to utilize smart contracts to establish trust between these parties, eliminating the need for security deposits. Additionally, we plan to introduce an insurance model where a small percentage of the rent contributes to an insurance pool, covering any potential damages to the property during the rental period. To claim insurance, users in the network need to participate in a voting process.

Our objectives are to enable users to:
- Find apartments available for rent (HabitatHub).
- Create smart contracts between renters and lenders (HabitatRent).
- Facilitate payment transactions between renters and lenders (HabitatRent).
- Provide insurance for the apartment and its furnishings during the rental term (HabitatVote).

## Files
```
.
├── contracts                   
│     ├── HabitatHub.sol          // Hub contract for all rental objects
│     ├── HabitatRent.sol         // Contract for each renting object
│     └── HabitatVote.sol         // Contract for voting insurance claims                                 
├── test                  
│     ├── HabitatHub.test.js      
│     ├── HabitatRent.test.js
│     └── HabitatVote.test.js                         
├── hardhat.config.js             // Hardhat config file
└── README.md
```

## Pre-Requisites

You need ```Node.js``` >=16.0 in order to run this project.

## Run Tests Locally

Clone the project

```bash
  git clone https://github.com/HabitatHash/HabitatHash.git
```

Go to the project directory

```bash
  cd HabitatHash
```

Install dependencies

```bash
  npm install
```

This project is built on Sepolia network, the tests will automatically be run against a Sepholia fork.
Go to https://infura.io, sign up, create a new API key

Setup an ```.env``` file and add your API key:
```bash
  INFURA_API_KEY={INSERT_KEY_HERE}
```

Start the server

```bash
  npx hardhat test
```

## Deploy locally

Create and run a Sepolia fork network

```bash
npx hardhat node
```

```bash
npx hardhat run --network localhost scripts/deploy.js
```

## Code coverage

To get a coverage report run

```bash
  npx hardhat coverage
```

## Authors

- [@edbag22](https://github.com/edbag22)
- [@filippaleuckfeld](https://github.com/filippaleuckfeld)

## Acknowledgement

We want to thank our professors [Martin Monperrus](http://www.monperrus.net/martin/) and [Benoit Baudry](https://softwarediversity.eu/) for teaching us about the programmable society and smart contracts.

## Appendix

Here is how DALL·E thinks this website would look like:
![DALL·E 2023-12-17 13 23 52 - A minimalistic website mockup for a smart contract-based housing rental platform  The design is sleek and simple, focusing on easy navigation and esse](https://github.com/HabitatHash/HabitatHash/assets/61015413/ad346068-f8fe-4ce1-a268-86aae5ceb392)

