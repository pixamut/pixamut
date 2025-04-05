// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {Project} from "./Project.sol";

/**
 * @notice A factory to deploy new Project instances.
 */
contract ProjectFactory is Ownable {
    address public stakingToken;
    address public stakingContract;
    uint256 public projectCreationFee = 0.5 ether;

    event ProjectCreated(
        address creator,
        address projectAddress,
        string title,
        string base64Image,
        uint256 initialgas
    );
    event ProjectCreationFeeUpdated(uint256 newFee);
    event Deposit(
        address projectAddress,
        address user,
        uint256 amount,
        uint256 gas
    );
    event Withdrawal(
        address projectAddress,
        address user,
        uint256 amount,
        uint16 pixelIdToUnstake
    );

    error InsufficientFee();
    error NoSToWithdraw();
    error CannotBurnS();
    error WithdrawFailed();

    constructor(
        address _stakingToken,
        address _stakingContract,
        address initialOwner
    ) Ownable(initialOwner) {
        stakingToken = _stakingToken;
        stakingContract = _stakingContract;
    }

    function notifyDeposit(address user, uint256 amount) external payable {
        // Forward any received ETH to owner
        if (msg.value > 0) {
            (bool success, ) = payable(owner()).call{value: msg.value}("");
            require(success, "ETH transfer failed");
        }
        emit Deposit(msg.sender, user, amount, msg.value);
    }

    function notifyWithdrawal(
        address user,
        uint256 amount,
        uint16 pixelIdToUnstake
    ) external {
        emit Withdrawal(msg.sender, user, amount, pixelIdToUnstake);
    }

    /**
     * @notice Owner can set or update the project creation fee.
     * @param newFee The new fee amount in wei.
     */
    function setProjectCreationFee(uint256 newFee) external onlyOwner {
        projectCreationFee = newFee;
        emit ProjectCreationFeeUpdated(newFee);
    }

    /**
     * @notice Deploys a new Project for the caller.
     * @dev Caller must send at least `projectCreationFee` in S.
     * @return projectAddress The address of the newly created Project.
     */
    function createProject(
        string calldata title,
        string calldata base64Image
    ) external payable returns (address projectAddress) {
        if (msg.value < projectCreationFee) revert InsufficientFee();

        Project newProject = new Project(
            stakingToken,
            stakingContract,
            address(this),
            owner()
        );

        // Forward creation fee to owner
        (bool success, ) = payable(owner()).call{value: msg.value}("");
        require(success, "ETH transfer failed");

        emit ProjectCreated(
            msg.sender,
            address(newProject),
            title,
            base64Image,
            msg.value
        );
        return address(newProject);
    }

    /**
     * @notice Withdraws all S currently in this contract to the specified address.
     * @param to The recipient of the withdrawn S.
     */
    function withdraw(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoSToWithdraw();
        if (to == address(0)) revert CannotBurnS();
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert WithdrawFailed();
    }
}
