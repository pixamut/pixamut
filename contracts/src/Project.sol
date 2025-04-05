// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IStakingContract {
    function stakePixel(uint16 pixelId, uint256 amount, uint24 color) external;

    function stakePixels(
        uint16[] calldata pixelIds,
        uint256[] calldata amounts,
        uint24[] calldata colors
    ) external;

    function unstakePixels(uint16[] calldata pixelIds) external;

    function unstakePixel(uint16 pixelId) external;

    function changePixelColor(uint16 pixelId, uint24 color) external;

    function changePixelsColors(
        uint16[] calldata pixelId,
        uint24[] calldata color
    ) external;
}

interface IProjectFactory {
    function notifyDeposit(address user, uint256 amount) external payable;

    function notifyWithdrawal(
        address user,
        uint256 amount,
        uint16 pixelIdToUnstake
    ) external;
}

/**
 * @title ProjectContract
 * @notice A contract that manages user deposits and interacts with a StakingContract to stake/unstake pixels.
 *         - An owner (can be changed via transferOwnership) can call stakePixels.
 *         - A creator is recorded at construction time (immutable).
 *         - Users can deposit & withdraw tokens from this contract.
 */
contract Project is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IStakingContract public stakingContract;

    // The address that originally deployed this ProjectContract (via factory or direct).
    address public immutable creator;
    IProjectFactory public immutable factory;

    // Tracks how much each user deposited into THIS contract
    // Note: This is public, meaning anyone can see the balances on-chain. That's typical in blockchain,
    // but if you prefer a "private" variable you can change this to 'mapping(address => uint256) private userBalance;'
    mapping(address => uint256) public userBalance;

    error DepositTooLow();
    error TransferFromFailed();
    error InsufficientContractBalance();
    error ApprovalFailed();
    error WithdrawTooLow();
    error InsufficientUserBalance();
    error InsufficientBalanceAfterUnstake();
    error TokenTransferFailed();

    constructor(
        address _stakingToken,
        address _stakingContract,
        address _factoryAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        stakingToken = IERC20(_stakingToken);
        stakingContract = IStakingContract(_stakingContract);

        // Record who created this contract instance
        creator = msg.sender;
        factory = IProjectFactory(_factoryAddress);

        // Approve
        stakingToken.approve(_stakingContract, type(uint256).max);
    }

    /**
     * @dev User deposits `amount` of stakingToken into this contract.
     *      - Caller must have approved this contract for at least `amount`.
     */
    function deposit(uint256 amount) external payable {
        if (amount == 0) revert DepositTooLow();

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        userBalance[msg.sender] += amount;
        factory.notifyDeposit{value: msg.value}(msg.sender, amount);
    }

    /**
     * @dev The contract stakes multiple pixels in the external staking contract.
     *      - Only the contract owner can call this method.
     */
    function stakePixels(
        uint16[] calldata pixelIds,
        uint256[] calldata amounts,
        uint24[] calldata colors
    ) external onlyOwner {
        uint256 totalRequired;
        for (uint8 i = 0; i < amounts.length; i++) {
            totalRequired += amounts[i];
        }

        if (stakingToken.balanceOf(address(this)) < totalRequired) {
            revert InsufficientContractBalance();
        }

        stakingContract.stakePixels(pixelIds, amounts, colors);
    }

    /**
     * @dev The contract stakes multiple pixels in the external staking contract.
     *      - Only the contract owner can call this method.
     */
    function changePixelsColors(
        uint16[] calldata pixelIds,
        uint24[] calldata colors
    ) external onlyOwner {
        stakingContract.changePixelsColors(pixelIds, colors);
    }

    /**
     * @dev Allows a user to withdraw up to `amount` of tokens from their project balance.
     *      If contract doesn't have enough tokens, tries to unstake the specified pixel IDs.
     *      The contract does NOT verify ownership of those pixels. In production,
     *      you'd want to ensure the user's claim is fair or authorized.
     */
    function withdraw(uint256 amount, uint16 pixelIdToUnstake) external {
        if (amount == 0) revert WithdrawTooLow();
        if (userBalance[msg.sender] < amount) revert InsufficientUserBalance();

        uint256 contractBalance = stakingToken.balanceOf(address(this));

        // If contract doesn't have enough to cover the withdrawal, try unstaking from the staking contract
        if (contractBalance < amount) {
            stakingContract.unstakePixel(pixelIdToUnstake);

            // Now, after unstaking, presumably the tokens are returned to ProjectContract
            contractBalance = stakingToken.balanceOf(address(this));
        }

        if (contractBalance < amount) revert InsufficientBalanceAfterUnstake();

        // Deduct from user
        userBalance[msg.sender] -= amount;

        // Transfer tokens to user
        stakingToken.safeTransfer(msg.sender, amount);

        factory.notifyWithdrawal(msg.sender, amount, pixelIdToUnstake);
    }
}
