const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KlerosBoardSuscription", function () {
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    this.deployer = accounts[0]
    this.player = accounts[1]
    this.player2 = accounts[1]

    const UBIBfactory = await hre.ethers.getContractFactory("UBIburner");
    this.ubiburner = await UBIBfactory.deploy(this.player.address, this.player2.address);
    await this.ubiburner.deployed();
    
    const KBSfactory = await ethers.getContractFactory("KlerosboardSuscription");
    this.maintainanceFee = 5;
    this.kbsub = await KBSfactory.deploy(this.ubiburner.address, this.maintainanceFee);
    await this.kbsub.deployed();

    // console.log("Contracts deployed");
  });

  it("owner and maintainer check", async function () {
    
    expect(await this.kbsub.owner()).to.equal(this.deployer.address);
    expect(await this.kbsub.maintainer()).to.equal(this.deployer.address);

  });

  it("Maintainance Fee changes", async function() {
    expect(await this.kbsub.maintenanceFeeDivisor()).to.be.equal(100/this.maintainanceFee);

    await expect(this.kbsub.changeMaintenanceFee(10))
    .to.emit(this.kbsub, 'MaintenanceFeeChanged')
    .withArgs(10);

    expect(await this.kbsub.maintenanceFeeDivisor()).to.be.equal(10);

  });

  it("Maintainer change revert if not Owner", async function() {
    await expect(this.kbsub.connect(this.player2).changeMaintainer(this.player.address)).to.be.reverted;
  });

  it("Maintainer change and emit event", async function() {

    await expect(this.kbsub.changeMaintainer(this.player.address))
    .to.emit(this.kbsub, 'MaintainerChanged')
    .withArgs(this.deployer.address, this.player.address);

    expect(await this.kbsub.maintainer()).to.be.equal(this.player.address);
  });

  it("transferOwnership revert if not Owner", async function() {
    await expect(this.kbsub.connect(this.player2).transferOwnership(this.player.address)).to.be.reverted;
  });

  it("transferOwnership change and emit event", async function() {

    await expect(this.kbsub.transferOwnership(this.player.address))
    .to.emit(this.kbsub, 'OwnershipTransferred')
    .withArgs(this.deployer.address, this.player.address);

    expect(await this.kbsub.owner()).to.be.equal(this.player.address);
  });
});
