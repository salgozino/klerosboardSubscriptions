//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract KlerosboardSuscription is Ownable {
    /* Events */
    /**
    *  @dev Emitted when the maintainer is changed.
    *  @param oldMaintainer address of the new maintainer.
    *  @param newMaintainer address of the new maintainer.
    */
    event MaintainerChanged(address indexed oldMaintainer, address indexed newMaintainer);

    /**
    *  @dev Emitted when the maintenance fee is changed.
    *  @param maintenanceFeeDivisor new value of maintainance fee
    */
    event MaintenanceFeeChanged(uint8 maintenanceFeeDivisor);

    /**
    *  @dev Emitted when the contract of UBIBurner is changed.
    *  @param UBIburner address of the new contract.
    */
    event UBUBurnerChanged(address UBIburner);

    /**
    *  @dev Emitted when the amount per month required of donation is changed.
    *  @param oldDonationAmount previous donation Amount
    *  @param donationAmount new donation Amount
    */
    event donationPerMonthChanged(uint256 oldDonationAmount, uint256 donationAmount);

    /**
    *  @dev Emitted when a donation it's made
    *  @param from who made the donation.
    *  @param amount amount of ETH donated.
    */
    event Donation(address indexed from, uint256 amount);

    /**
    *  @dev Emitted when a donation it's made
    *  @param from who made the donation.
    *  @param amount amount of ETH sent to UBI Burner
    */    
    event UBIBurnDonation(address indexed from, uint256 amount);

    /* Constants */
    /// @dev Contract Maintainer
    address public maintainer;
    /// @dev divisor to calculate the Maintenance Fee
    uint8 public maintenanceFeeDivisor;
    /// @dev UBIburner Contract
    address private UBIburner;
    /// @dev Amount per month to Enable klerosboard Features
    uint256 public donationPerMonth;

    /// @dev Indicates if the address have donated at least once some amount. isDonor[address].
    mapping(address => bool) public isDonor;
    
    /// @dev Indicates the total amount donated by address. getTotalDonor[address].
    mapping(address => uint256) public getTotalDonor;


    constructor(address _UBIburner, uint8 _maintenanceFee, uint96 _donationPerMonth) {
        maintainer = msg.sender;
        changeMaintenanceFee(_maintenanceFee);
        UBIburner = _UBIburner;
        donationPerMonth = _donationPerMonth;
    }

    /**
    *  @dev Donate ETH
    */
    function donate() payable external {
        require(msg.value > 0, 'ETH to be donated > 0');
        // TODO: THIS NEED TO BE TESTED!. Overflows?
        uint256 maintainanceFee = msg.value / maintenanceFeeDivisor;
        uint256 ETHToBurnUBI = msg.value - maintainanceFee;
        require(ETHToBurnUBI > maintainanceFee, 'Overflow');
        // Send ETH - maintainanceFee to UBIBurner
        (bool successTx, ) = UBIburner.call{value: ETHToBurnUBI}("");
        require(successTx, "ETH to UBIBurner fail");
        
        
        isDonor[msg.sender] = true;
        getTotalDonor[msg.sender] += msg.value;
        emit UBIBurnDonation(msg.sender, ETHToBurnUBI);
        emit Donation(msg.sender, msg.value);
    }

    function changeMaintainer (address _maintainer) public onlyOwner {
        require(_maintainer != address(0), 'Maintainer could not be null');
        address oldMaintainer = maintainer;
        maintainer = _maintainer;
        emit MaintainerChanged(oldMaintainer, maintainer);
    }

    function changeMaintenanceFee (uint8 _newFee) public onlyOwner {
        // TODO: Check fees definition
        require(_newFee <= 10, '10% it is the max fee allowed');
        maintenanceFeeDivisor = 100 / _newFee;
        // express maintainance as a multiplier.
        // Like 0 < _newFee < 10, it's safe to calculate 100 / _newFee
        emit MaintenanceFeeChanged(maintenanceFeeDivisor);
    }

    function changeUBIBurner (address _UBIBurner) public onlyOwner {
        require(_UBIBurner != address(0), 'null address');
        UBIburner = _UBIBurner;
        emit UBUBurnerChanged(UBIburner);
    }

    function changeDonationPerMonth (uint256 _donationPerMonth) public onlyOwner {
        require(_donationPerMonth > 0, 'donationPerMonth should not be zero');
        uint256 oldDonation = donationPerMonth;
        donationPerMonth = _donationPerMonth;
        emit donationPerMonthChanged(oldDonation, donationPerMonth);
    }

    function withdrawMaintenance() external {
        require(msg.sender == maintainer, 'Only maintainer can withdraw');
        payable(msg.sender).transfer(address(this).balance);
    }
}
