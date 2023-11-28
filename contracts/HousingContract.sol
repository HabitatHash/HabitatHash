// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract HousingRentalContract {
    // Contract owner (landlord)
    address public landlord;

    // Renter of the property
    address public renter;

    // Rental property details
    string public propertyAddress;
    //bool public isFurnished;
    //bool public hasStorage;
    
    // Rental terms
    uint public startTimestamp;
    uint public endTimestamp;
    uint public monthlyRent;
    //enum Utilities { Electricity, Water, Internet, Heating }
    //Utilities[] public includedUtilities;

    // Constructor to set initial values
    constructor(
        address _renter,
        string memory _propertyAddress,
        //bool _isFurnished,
        //bool _hasStorage,
        uint _startTimestamp,
        uint _endTimestamp,
        uint _monthlyRent
        //Utilities[] memory _includedUtilities
    ) {
        landlord = msg.sender;
        renter = _renter;
        propertyAddress = _propertyAddress;
        //isFurnished = _isFurnished;
        //hasStorage = _hasStorage;
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
        monthlyRent = _monthlyRent;
        //for (uint i = 0; i < _includedUtilities.length; i++) {
        //    includedUtilities.push(_includedUtilities[i]);
        //}
    }

    // Function to terminate the contract
    function terminateContract() public {
        require(msg.sender == renter || msg.sender == landlord, "Only landlord or renter can terminate the contract");
        endTimestamp = block.timestamp; // Update the end timestamp to current time
    }

    // Function to pay rent (simplified version)
    function payRent() public payable {
        require(msg.sender == renter, "Only the renter can pay the rent");
        require(msg.value == monthlyRent, "Incorrect rent amount");
        payable(landlord).transfer(msg.value);
    }
    
    // Additional functions for contract management can be added here
    // ...
}