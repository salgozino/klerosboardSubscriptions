// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {

  eoa = await ethers.getSigners();

  // We get the contract to deploy
  const UBIBfactory = await hre.ethers.getContractFactory("UBIburner");
  const ubiburner = await UBIBfactory.deploy(eoa[0].address, eoa[1].address);
  await ubiburner.deployed();
  console.log("UBIBurner deployed to:", ubiburner.address);

  const KBSfactory = await hre.ethers.getContractFactory("KlerosboardSuscription");
  const kbsub = await KBSfactory.deploy(ubiburner.address, 5);

  await kbsub.deployed();

  console.log("KlerosBoardSuscription deployed to:", kbsub.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
