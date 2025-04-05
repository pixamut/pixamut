// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PixelStaking
 * @notice Lets users stake tokens on pixels in a 100×100 grid.
 *         Users can overwrite a pixel by staking a higher amount than the current stake.
 *         The previous stake is refunded to the old owner.
 */
contract PixelStaking is Ownable {
    using SafeERC20 for IERC20;

    error InvalidToken();
    error InvalidPixelId();
    error InsufficientStakeAmount();
    error NotPixelOwner();
    error ArrayLengthMismatch();

    event PixelStaked(
        address staker,
        uint16 pixelId,
        uint256 amount,
        uint24 color
    );
    event PixelsStaked(
        address staker,
        uint16[] pixelIds,
        uint256[] amounts,
        uint24[] colors
    );
    event PixelUnstaked(address staker, uint16 pixelId);
    event PixelsUnstaked(address staker, uint16[] pixelIds);
    event PixelColorChanged(uint16 pixelId, uint24 color);
    event PixelsColorChanged(uint16[] pixelIds, uint24[] colors);

    IERC20 public immutable stakingToken;
    uint8 public constant GRID_SIZE = 100;
    uint16 public constant TOTAL_PIXELS = uint16(GRID_SIZE) * uint16(GRID_SIZE);

    struct PixelData {
        address owner;
        uint24 color;
        uint256 stakeAmount; // The amount staked to own this pixel
    }

    mapping(uint16 => PixelData) public pixels;

    modifier validPixelId(uint16 pixelId) {
        if (pixelId >= TOTAL_PIXELS) {
            revert InvalidPixelId();
        }
        _;
    }

    constructor(
        IERC20 _stakingToken,
        address initialOwner
    ) Ownable(initialOwner) {
        if (address(_stakingToken) == address(0)) revert InvalidToken();
        stakingToken = _stakingToken;
    }

    /**
     * @notice Stake a single pixel by providing a higher stake than the current owner.
     * @dev Refunds the previous owner's stake.
     * @param pixelId   Which pixel to stake.
     * @param amount    How many tokens to stake.
     * @param color     The desired color for the pixel.
     */
    function stakePixel(
        uint16 pixelId,
        uint256 amount,
        uint24 color
    ) external validPixelId(pixelId) {
        PixelData storage pixel = pixels[pixelId];
        if (amount <= pixel.stakeAmount) {
            revert InsufficientStakeAmount();
        }

        // Transfer the new stake in
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Refund old owner, if any
        address previousOwner = pixel.owner;
        uint256 previousAmount = pixel.stakeAmount;
        if (previousOwner != address(0) && previousAmount > 0) {
            stakingToken.safeTransfer(previousOwner, previousAmount);
        }

        // Update pixel ownership
        pixel.owner = msg.sender;
        pixel.stakeAmount = amount;
        pixel.color = color;

        emit PixelStaked(msg.sender, pixelId, amount, color);
    }

    /**
     * @notice Batch version of stakePixel, more gas efficient for multiple pixel updates.
     * @dev Each pixel must have a strictly larger stake than its current stake.
     */
    function stakePixels(
        uint16[] calldata pixelIds,
        uint256[] calldata amounts,
        uint24[] calldata colors
    ) external {
        if (
            pixelIds.length != amounts.length || amounts.length != colors.length
        ) {
            revert ArrayLengthMismatch();
        }

        // 1. Calculate total required stake for all pixels.
        uint256 totalRequired;
        for (uint256 i = 0; i < pixelIds.length; i++) {
            if (pixelIds[i] >= TOTAL_PIXELS) {
                revert InvalidPixelId();
            }
            totalRequired += amounts[i];
        }

        // 2. Transfer total stake in one go
        stakingToken.safeTransferFrom(msg.sender, address(this), totalRequired);

        // 3. Process each pixel and refund previous owners
        for (uint8 i = 0; i < pixelIds.length; i++) {
            uint16 pixelId = pixelIds[i];
            uint256 amount = amounts[i];
            uint24 color = colors[i];

            PixelData storage pixel = pixels[pixelId];
            if (amount <= pixel.stakeAmount) {
                revert InsufficientStakeAmount();
            }

            address prevOwner = pixel.owner;
            uint256 prevAmount = pixel.stakeAmount;

            // Refund previous stake
            if (prevOwner != address(0) && prevAmount > 0) {
                stakingToken.safeTransfer(prevOwner, prevAmount);
            }

            // Update ownership
            pixel.owner = msg.sender;
            pixel.stakeAmount = amount;
            pixel.color = color;
        }
        emit PixelsStaked(msg.sender, pixelIds, amounts, colors);
    }

    /**
     * @notice Change the color of a pixel you already own (no extra stake).
     */
    function changePixelColor(
        uint16 pixelId,
        uint24 color
    ) public validPixelId(pixelId) {
        PixelData storage pixel = pixels[pixelId];
        if (pixel.owner != msg.sender) {
            revert NotPixelOwner();
        }
        pixel.color = color;
        emit PixelColorChanged(pixelId, color);
    }

    function changePixelsColors(
        uint16[] calldata pixelIds,
        uint24[] calldata colors
    ) external {
        if (pixelIds.length != colors.length) {
            revert ArrayLengthMismatch();
        }
        for (uint8 i = 0; i < pixelIds.length; i++) {
            PixelData storage pixel = pixels[pixelIds[i]];
            if (pixel.owner != msg.sender) {
                revert NotPixelOwner();
            }
            pixel.color = colors[i];
        }
        emit PixelsColorChanged(pixelIds, colors);
    }

    /**
     * @notice Unstake (remove your stake) from a pixel you own.
     * @dev Resets the pixel to no owner, zero stake, and color = 0.
     */
    function unstakePixel(uint16 pixelId) external validPixelId(pixelId) {
        PixelData storage pixel = pixels[pixelId];
        if (pixel.owner != msg.sender) {
            revert NotPixelOwner();
        }
        uint256 amount = pixel.stakeAmount;

        // Clear pixel data
        pixel.owner = address(0);
        pixel.stakeAmount = 0;
        pixel.color = 0;

        // Return staked tokens to the owner
        stakingToken.safeTransfer(msg.sender, amount);

        emit PixelUnstaked(msg.sender, pixelId);
    }

    function unstakePixels(uint16[] calldata pixelIds) external {
        uint256 totalRefund = 0;

        // First loop to validate ownership and calculate total refund
        for (uint256 i = 0; i < pixelIds.length; i++) {
            if (pixelIds[i] >= TOTAL_PIXELS) {
                revert InvalidPixelId();
            }
            PixelData storage pixel = pixels[pixelIds[i]];
            if (pixel.owner == msg.sender) {
                totalRefund += pixel.stakeAmount;
                pixel.owner = address(0);
                pixel.stakeAmount = 0;
                pixel.color = 0;
            }
        }
        // Single transfer for all refunds
        if (totalRefund > 0) {
            stakingToken.safeTransfer(msg.sender, totalRefund);
        }
        emit PixelsUnstaked(msg.sender, pixelIds);
    }
}
