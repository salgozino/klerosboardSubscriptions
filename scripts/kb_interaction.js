// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {

  eoa = await ethers.getSigners();

  const KBSfactory = await hre.ethers.getContractFactory("KlerosboardSuscription");
  const kbsub = KBSfactory.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const ubiburner = await kbsub.ubiburner();
  console.log("UBIBurner: ", ubiburner);
  await kbsub.donate({value: hre.ethers.utils.parseUnits('0.1','ether')})

  console.log("Balance of KB:", (await hre.ethers.provider.getBalance(kbsub.address)).toString())
  
  console.log("Balance of UBIBurner:", (await hre.ethers.provider.getBalance(ubiburner)).toString())


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
