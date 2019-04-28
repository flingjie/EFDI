pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Mintable.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract FlightDelay is ERC721Full, ERC721Mintable, Ownable {
    
    event Insured(address user, uint256 price); 
    event Checked(uint d, uint total, uint count, uint unit); 
    event Payout(address user, uint256 amount); 

    struct InsurancePolicy {
        address payable user;
        bytes24 flightNo;
        uint256 price;
    }

    struct FlightInfo {
        uint landingTime;
        uint landingTimeActual;
        bool isDelay;
    }

    mapping (uint => InsurancePolicy[]) public policylist;
    mapping (uint => address payable[]) public payUsers;
    mapping (bytes24 => FlightInfo) public flightlist;
    mapping (uint => uint256) public policytotal;
    mapping(address => uint) userReward;
    uint256 curId;

    constructor() ERC721Full("FlightDelay", "FD") public {
    }

    /*
     * Create new flight insurance policy on blockchain.
     * @param day, flightNo, price
     * @return true when success.
     */
    function createInsurance(
        uint day,
        bytes24 flightNo,
        uint256 price
    )
        public
        payable
        returns (bool)
    {
        require(msg.value >= price);
        require(msg.value >= 40000);
        uint price2 = price - 40000;
        InsurancePolicy memory _policy = InsurancePolicy({
            user: msg.sender,
            flightNo: flightNo,
            price: price2 
        });
        policylist[day].push(_policy);
        policytotal[day] += price2;
        curId += 1;
        require(curId <= 4294967295);
        _mint(msg.sender, curId);
        emit Insured(msg.sender, price);
        return true;
    }


    /*
     * Add flight info on blockchain.
     * @param flightNo, landingTime, landingTimeActual
     * @return true when success.
     */
    function addFlightInfo(
        bytes24 flightNo,
        uint landingTime,
        uint landingTimeActual
    )
        onlyOwner
        public
        returns (bool)
    {
        bool isDelay = false;
        if(landingTimeActual > landingTime + 60 * 60){
            isDelay = true;
        }
        FlightInfo memory _flight = FlightInfo({
            landingTime: landingTime,
            landingTimeActual: landingTimeActual,
            isDelay: isDelay
        });
        flightlist[flightNo] = _flight;
    }

    /*
     * @dev Check the insurance list and payout.
     * @param day.
     * @return true when success.
     */
    function checkInsurnce(uint day) onlyOwner public returns (bool) 
    {
        if(policylist[day].length == 0){
            return true;
        }
        uint256 count = 0;
        
        for(uint i=0;i<policylist[day].length;i++){
            InsurancePolicy memory _p = policylist[day][i];
            if(flightlist[_p.flightNo].isDelay) {
                payUsers[day].push(_p.user);
                userReward[_p.user] = _p.price;
                count += _p.price;
            } 
        }
        uint pay_unit = policytotal[day] / count;
        emit Checked(day, policytotal[day], count, pay_unit);
        for(uint i=0;i<payUsers[day].length;i++){
            address payable _u = payUsers[day][i];
            uint256 pay_amount = userReward[_u] * pay_unit;
            _u.transfer(pay_amount);
            emit Payout(_u, pay_amount);
        }
    }
}


