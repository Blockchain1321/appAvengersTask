// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const MNFT = await ethers.getContractFactory("MyNFT");
  const MyNFT = await MNFT.deploy();
  await MyNFT.deployed();

  const NFTMP= await ethers.getContractFactory("NFTMarketplace");
  const NFTMarketplace = await NFTMP.deploy();
  await NFTMarketplace.deployed();


  console.log("NFTmarketplace contract address :",NFTMarketplace.address);
  console.log("NFT contract address :",MyNFT.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
