// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

async function main() {
  donationPerMonth = hre.ethers.utils.parseUnits('0.2', 'ether');
  maintenanceFee = 1000;
  await hre.run("verify:verify", {
    address: "0x9313F75F4C49a57D1D0158232C526e24Bb40f281",
    constructorArguments: [
      "0x481B24Ed5feAcB37e282729b9815e27529Cf9ae2",
      maintenanceFee,
      donationPerMonth
    ],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
