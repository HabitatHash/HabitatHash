// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./HabitatVote.sol";
import "./HabitatRent.sol";

contract HabitatHub {
    struct ObjectInformation {
        string objectAddress; // The address to the rental obejct (123 Main St)
        uint256 rent; //How much the rent is
        uint256 numberOfRooms; //Number of rooms in the object
        uint256 sqm; //How many square meters the object is
        bool isFurnished; //Is the object furnished?
    }
    struct RentalObject {
        ObjectInformation description; // Description of the object
        address owner; // Owner of the rental object
        bool isRented; // is apartment rented out
        address contractAddress; // address to the current active contract
    }
    struct RentalContract {
        HabitatRent rentalContract;
        address insuranceContract;
    }
    struct InsuranceContract {
        HabitatVote insuranceContract;
        bool hasClaimed;
    }

    //Oracle to get USD to ETH
    AggregatorV3Interface internal priceFeed =
        AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);

    //Array to store all current object ids
    uint256[] public objectIds;

    //Mappings to store all rental objects and contracts
    mapping(uint256 => RentalObject) public rentalObjects;
    mapping(address => RentalContract) public rentalContracts;
    mapping(address => InsuranceContract) public insuranceContracts;

    // Events helps off-chain applications understand what happens within your contract.
    event AddObject(address indexed _landlord, uint256 _objectId);
    event RemoveObject(address indexed _landlord, uint256 _objectId);
    event Rent(address indexed _renter, uint256 _objectId);
    event EndRent(address indexed _renter, uint256 _objectId);
    event InsuranceClaimed(address indexed _user, uint256 _value);
    event InsuranceApplied(
        address indexed _user,
        address indexed rentalContract,
        string _description,
        uint256 _value
    );

    //Input USD to get rent in Wei.
    function getUsdToWei(uint value) public view returns (uint) {
        (, int price, , , ) = priceFeed.latestRoundData();
        //priceFeed has 8 decimals, adding 26 (18+8) decimals to value to get Wei.
        return (value * (10 ** 26)) / uint(price);
    }

    // The contract should be able to recieve payments to keep as an insurance pool
    function deposit() external payable {}

    //Get all object ids
    function getAllObjectIds() public view returns (uint256[] memory) {
        return objectIds;
    }

    //Get the rental object from id
    function getRentalObject(
        uint256 objectId
    ) public view returns (RentalObject memory) {
        return rentalObjects[objectId];
    }

    //Get all rental objects
    function getAllRentalObjects() public view returns (RentalObject[] memory) {
        uint256[] memory allObjectIds = getAllObjectIds();
        RentalObject[] memory allRentalObjects = new RentalObject[](
            allObjectIds.length
        );

        for (uint256 i = 0; i < allObjectIds.length; i++) {
            allRentalObjects[i] = getRentalObject(allObjectIds[i]);
        }

        return allRentalObjects;
    }

    //Add object HabitatHash
    function addObject(
        string memory objectAddress,
        uint256 rent,
        uint256 numberOfRooms,
        uint256 sqm,
        bool isFurnished
    ) public {
        //Hashes the address to a uint to be used as a key in mapper
        uint256 objectId = uint256(keccak256(abi.encodePacked(objectAddress)));

        require(
            !idExists(objectId),
            "You cannot add multiple of same rental objects"
        );

        rentalObjects[objectId] = RentalObject(
            ObjectInformation(
                objectAddress,
                rent,
                numberOfRooms,
                sqm,
                isFurnished
            ),
            msg.sender,
            false,
            address(0)
        );
        objectIds.push(objectId);

        emit AddObject(msg.sender, objectId);
    }

    //Remove object from HabitatHash
    function removeObject(uint256 objectId) public {
        require(
            rentalObjects[objectId].isRented == false,
            "Object is currently rented out"
        );
        require(
            rentalObjects[objectId].owner == msg.sender,
            "You can only remove your own objects"
        );

        //Replaces the element to be removed with the last element, and then removes the last element
        for (uint256 i = 0; i < objectIds.length; i++) {
            if (objectIds[i] == objectId) {
                objectIds[i] = objectIds[objectIds.length - 1];
                objectIds.pop();
            }
        }

        emit RemoveObject(msg.sender, objectId);
    }

    //Start the renting process, creates a housingRentalContract
    function rentObject(uint256 objectId, uint256 monthsToRent) public {
        require(idExists(objectId), "Object doesnt exist");
        require(
            rentalObjects[objectId].isRented == false,
            "Object is already rented"
        );

        rentalObjects[objectId].isRented = true;

        uint rentInWei = getUsdToWei(rentalObjects[objectId].description.rent);

        HabitatRent rentalContact = new HabitatRent(
            this,
            rentalObjects[objectId].owner,
            msg.sender,
            objectId,
            monthsToRent,
            rentInWei
        );

        rentalObjects[objectId].contractAddress = address(rentalContact);
        rentalContracts[address(rentalContact)] = RentalContract(
            rentalContact,
            address(0)
        );

        emit Rent(msg.sender, objectId);
    }

    //Ends the renting process, makes the object available again
    function endRentObject(uint256 objectId) public {
        require(
            rentalObjects[objectId].isRented == true,
            "Object is not rented"
        );

        HabitatRent rentalContract = rentalContracts[
            rentalObjects[objectId].contractAddress
        ].rentalContract;

        require(rentalContract.checkFulfilled(), "Contract is not fulfilled");

        rentalObjects[objectId].isRented = false;
        rentalObjects[objectId].contractAddress = address(0);

        emit EndRent(msg.sender, objectId);
    }

    //Opens an insurance claim. A insurance contract is created for people to vote in
    function applyForInsurance(
        address rentalContractAddress,
        string memory description,
        uint256 value
    ) public {
        HabitatRent rentalContract = rentalContracts[rentalContractAddress]
            .rentalContract;
        address insuranceContractAddress = rentalContracts[
            rentalContractAddress
        ].insuranceContract;

        require(
            rentalContract.landlord() == msg.sender,
            "You can only apply for insurance on your own contract"
        );

        require(
            insuranceContractAddress == address(0),
            "You can only create one insurance claim per rental contract"
        );

        HabitatVote insuranceContract = new HabitatVote(
            msg.sender,
            rentalContractAddress,
            description,
            value
        );

        rentalContracts[rentalContractAddress].insuranceContract = address(
            insuranceContract
        );
        insuranceContracts[address(insuranceContract)] = InsuranceContract(
            insuranceContract,
            false
        );
        emit InsuranceApplied(
            msg.sender,
            rentalContractAddress,
            description,
            value
        );
    }

    //If a voting is successfull, the value can be claimed.
    function claimInsurance(address rentalContractAddress) public {
        address insuranceContractAddress = rentalContracts[
            rentalContractAddress
        ].insuranceContract;

        require(
            insuranceContractAddress != address(0),
            "No insurance claim on this contract"
        );

        HabitatVote insuranceContract = insuranceContracts[
            insuranceContractAddress
        ].insuranceContract;

        require(
            insuranceContract.owner() == msg.sender,
            "You dont own that contract"
        );

        require(
            insuranceContract.getResult(),
            "It has been voted you should not get insurance"
        );

        require(
            !insuranceContracts[insuranceContractAddress].hasClaimed,
            "This insurance has already been claimed"
        );

        uint insuranceAmount = insuranceContract.getCase().value;

        require(
            address(this).balance >= insuranceAmount,
            "Insufficient balance in the contract"
        );

        insuranceContracts[insuranceContractAddress].hasClaimed = true;
        payable(msg.sender).transfer(insuranceAmount);

        emit InsuranceClaimed(msg.sender, insuranceAmount);
    }

    //Checks if a given id exists
    function idExists(uint256 id) private view returns (bool) {
        for (uint256 i = 0; i < objectIds.length; i++) {
            if (objectIds[i] == id) return true;
        }
        return false;
    }
}
