// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "./HabitatHub.sol";

contract HabitatRent {
    //Hub contract
    HabitatHub habitatHub;

    address public landlord;
    address public renter;

    uint public monthsToRent;
    uint public monthlyRent;
    uint public objectId;

    uint public rentsPaid;
    bool public isTerminated;

    constructor(
        HabitatHub _habitatHub,
        address _landlord,
        address _renter,
        uint _objectId,
        uint _monthsToRent,
        uint _monthlyRent
    ) {
        habitatHub = _habitatHub;
        landlord = _landlord;
        renter = _renter;
        objectId = _objectId;
        monthsToRent = _monthsToRent;
        monthlyRent = _monthlyRent;
    }

    event rentPaid(
        address indexed _renter,
        uint256 objectId,
        uint256 monthlyRent
    );
    event contractTerminated(address indexed terminator, uint256 objectId);

    // Helper functions
    function getMonthsToRent() public view returns (uint) {
        return monthsToRent;
    }

    function getMontlyRent() public view returns (uint256) {
        return monthlyRent;
    }

    // Function to terminate the contract
    function terminateContract() public {
        require(rentsPaid >= monthsToRent, "All rents are not paid");
        require(
            msg.sender == renter || msg.sender == landlord,
            "Only landlord or renter can terminate the contract"
        );

        isTerminated = true;
        habitatHub.endRentObject(objectId);
        emit contractTerminated(msg.sender, objectId);
    }

    //Used by renter to pay rent to landlord
    function payRent() public payable {
        require(isTerminated == false, "Contract is already terminated");
        require(rentsPaid < monthsToRent, "You have already paid all rents");
        require(msg.sender == renter, "Only the renter can pay the rent");
        require(msg.value == monthlyRent, "Incorrect rent amount");

        uint256 insuranceFee = (msg.value* 2) / 100; // 2% insurance fee
        habitatHub.deposit{value: insuranceFee}();

        payable(landlord).transfer(msg.value-insuranceFee);
        rentsPaid += 1;
        emit rentPaid(msg.sender, objectId, msg.value);
    }

    //Checks if all rents are paid
    function checkFulfilled() public view returns (bool) {
        return monthsToRent <= rentsPaid;
    }
}
