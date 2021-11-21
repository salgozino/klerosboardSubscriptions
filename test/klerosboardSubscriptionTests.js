const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KlerosBoardSuscription", function () {
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    this.deployer = accounts[0]
    this.account1 = accounts[1]
    this.account2 = accounts[2]

    const UBIBfactory = await ethers.getContractFactory("UBIburner");
    this.ubiburner = await UBIBfactory.deploy(this.account1.address, this.account2.address);
    await this.ubiburner.deployed();
    
    const KBSfactory = await ethers.getContractFactory("KlerosboardSuscription");
    this.maintainanceFee = 5;
    this.donationPerMonth = 10000000000;
    this.kbsub = await KBSfactory.deploy(this.ubiburner.address, this.maintainanceFee, this.donationPerMonth);
    await this.kbsub.deployed();

    this.provider = ethers.provider;

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
    await expect(this.kbsub.connect(this.account2).changeMaintainer(this.account1.address)).to.be.reverted;
  });

  it("Maintainer change and emit event", async function() {

    await expect(this.kbsub.changeMaintainer(this.account1.address))
    .to.emit(this.kbsub, 'MaintainerChanged')
    .withArgs(this.deployer.address, this.account1.address);

    expect(await this.kbsub.maintainer()).to.be.equal(this.account1.address);
  });

  it("transferOwnership revert if not Owner", async function() {
    await expect(this.kbsub.connect(this.account2).transferOwnership(this.account1.address)).to.be.reverted;
  });

  it("transferOwnership change and emit event", async function() {

    await expect(this.kbsub.transferOwnership(this.account1.address))
    .to.emit(this.kbsub, 'OwnershipTransferred')
    .withArgs(this.deployer.address, this.account1.address);

    expect(await this.kbsub.owner()).to.be.equal(this.account1.address);
  });

  it("only Owner can change donationPerMonth", async function() {

    await expect(this.kbsub.connect(this.account1).changeDonationPerMonth(200000000))
    .to.be.reverted;
  });

  it("not allow donationPerMonth equals zero", async function() {
    await expect(this.kbsub.changeDonationPerMonth(0))
    .to.be.revertedWith("donationPerMonth should not be zero");

  });

  it("change donationPerMonth and emit event", async function() {
    expect(await this.kbsub.donationPerMonth()).to.be.equal(this.donationPerMonth);
    
    await expect(this.kbsub.changeDonationPerMonth(200000000))
    .to.emit(this.kbsub, 'donationPerMonthChanged')
    .withArgs(this.donationPerMonth, 200000000);
    
    expect(await this.kbsub.donationPerMonth()).to.be.equal(200000000);

  });

  it("1ETH Donation - Balances - account2", async function(){
    await this.kbsub.connect(this.account2).donate({value:  ethers.utils.parseUnits('1', 'ether')});
    kb_balance = await this.provider.getBalance(this.kbsub.address)
    ubiburn_balance = await this.provider.getBalance(this.ubiburner.address)
    
    expect(kb_balance).to.be.equal(ethers.utils.parseUnits('0.05', 'ether'));
    expect(ubiburn_balance).to.be.equal(ethers.utils.parseUnits('0.95', 'ether'));
    expect(await this.kbsub.isDonor(this.account2.address)).to.be.true;
    expect(await this.kbsub.isDonor(this.account1.address)).to.be.false;
    expect(await this.kbsub.getTotalDonor(this.account2.address)).to.be.equal(ethers.utils.parseUnits('1', 'ether'));

  });

  it("1ETH Donation - Balances - account1", async function(){
    await this.kbsub.connect(this.account1).donate({value:  ethers.utils.parseUnits('1', 'ether')});
    kb_balance = await this.provider.getBalance(this.kbsub.address)
    ubiburn_balance = await this.provider.getBalance(this.ubiburner.address)
    
    expect(kb_balance).to.be.equal(ethers.utils.parseUnits('0.05', 'ether'));
    expect(ubiburn_balance).to.be.equal(ethers.utils.parseUnits('0.95', 'ether'));
    expect(await this.kbsub.isDonor(this.account1.address)).to.be.true;
    expect(await this.kbsub.isDonor(this.account2.address)).to.be.false;
    expect(await this.kbsub.getTotalDonor(this.account1.address)).to.be.equal(ethers.utils.parseUnits('1', 'ether'));

  });

  it("1ETH Donation - KB events - account1", async function() {

    await expect(this.kbsub.connect(this.account1).donate({value: ethers.utils.parseUnits('1', 'ether')}))
    .to.emit(this.kbsub, 'Donation')
    .withArgs(this.account1.address, ethers.utils.parseUnits('1', 'ether'));

    expect(await this.kbsub.isDonor(this.account1.address)).to.be.true;
    expect(await this.kbsub.getTotalDonor(this.account1.address)).to.be.equal(ethers.utils.parseUnits('1', 'ether'));

  });

  it("1ETH Donation - UbiBurn event - account1", async function() {

    await expect(this.kbsub.connect(this.account1).donate({value: ethers.utils.parseUnits('1', 'ether')}))
    .to.emit(this.kbsub, 'UBIBurnDonation')
    .withArgs(this.account1.address, ethers.utils.parseUnits('0.95', 'ether'));

    expect(await this.kbsub.isDonor(this.account1.address)).to.be.true;
    expect(await this.kbsub.getTotalDonor(this.account1.address)).to.be.equal(ethers.utils.parseUnits('1', 'ether'));
  });

  it("Withdraw only by maintainer", async function(){
    await expect(this.kbsub.connect(this.account1).withdrawMaintenance())
    .to.be.revertedWith('Only maintainer can withdraw');
  });

  
  it("1ETH Donation and withdraw", async function(){
    await this.kbsub.connect(this.account1).donate({value:  ethers.utils.parseUnits('1', 'ether')});
    
    expect(await this.provider.getBalance(this.kbsub.address)).to.be.equal(ethers.utils.parseUnits('0.05', 'ether'));
    await this.kbsub.withdrawMaintenance();
    expect(await this.provider.getBalance(this.kbsub.address)).to.be.equal(ethers.utils.parseUnits('0', 'ether'));
  });


  it("Multiple donors", async function(){
    await this.kbsub.connect(this.account1).donate({value:  ethers.utils.parseUnits('1', 'ether')});
    await this.kbsub.connect(this.account1).donate({value:  ethers.utils.parseUnits('0.5', 'ether')});
    
    await this.kbsub.connect(this.account2).donate({value:  ethers.utils.parseUnits('2', 'ether')});
    
    kb_balance = await this.provider.getBalance(this.kbsub.address)
    ubiburn_balance = await this.provider.getBalance(this.ubiburner.address)
    
    expect(kb_balance).to.be.equal(ethers.utils.parseUnits('0.175', 'ether'));
    expect(ubiburn_balance).to.be.equal(ethers.utils.parseUnits('3.325', 'ether'));
    

    expect(await this.kbsub.isDonor(this.account1.address)).to.be.true;
    expect(await this.kbsub.isDonor(this.account2.address)).to.be.true;
    expect(await this.kbsub.isDonor(this.deployer.address)).to.be.false;


    expect(await this.kbsub.getTotalDonor(this.account2.address)).to.be.equal(ethers.utils.parseUnits('2', 'ether'));

    expect(await this.kbsub.getTotalDonor(this.account1.address)).to.be.equal(ethers.utils.parseUnits('1.5', 'ether'));


  })
  
});
