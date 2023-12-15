// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract HousingRentalContract {
    address public landlord;
    address public renter;

    // Rental terms
    uint public startTimestamp;
    uint public endTimestamp;
    uint public monthlyRent;
    uint public rentalObject;

    // Add something to keep track on payments
    uint public rentPaid;
    uint public totalRent;

    // Constructor to set initial values
    constructor(
        address _renter,
        uint _rentalObject,
        uint _startTimestamp,
        uint _endTimestamp,
        uint _monthlyRent
    ) {
        landlord = msg.sender;
        renter = _renter;
        rentalObject = _rentalObject;
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
        monthlyRent = _monthlyRent;
    }

    // Function to terminate the contract
    function terminateContract() public {
        require(msg.sender == renter || msg.sender == landlord, "Only landlord or renter can terminate the contract");
        endTimestamp = block.timestamp; // Update the end timestamp to current time
    }

    function payRent() public payable {
        require(msg.sender == renter, "Only the renter can pay the rent");
        require(msg.value == monthlyRent, "Incorrect rent amount");
        payable(landlord).transfer(msg.value);
        rentPaid += msg.value;
    }

    function contractFulfilled() public view returns (bool) {
        return totalRent <= rentPaid;
    }
    
}