// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../src/PixelStaking.sol";
import "../src/PXMTToken.sol";

contract PixelStakingTest is Test {
    PixelStaking public pixelStaking;
    Token public token;

    address admin = makeAddr("admin");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        token = new Token("PXMT", "PIXAMUT");
        pixelStaking = new PixelStaking(IERC20(address(token)), admin);

        // Mint some tokens to testors
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);

        // approve
        vm.startPrank(alice);
        token.approve(address(pixelStaking), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(bob);
        token.approve(address(pixelStaking), type(uint256).max);
        vm.stopPrank();
    }

    function testInitialState() public view {
        // TODO fuzzy
        uint16 pixelId = 12;
        (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
            pixelId
        );
        assertEq(owner, address(0));
        assertEq(stake, 0);
        assertEq(color, 0);
    }

    function testStakePixel() public {
        uint16 pixelId = 1;
        uint256 previousBalance = token.balanceOf(alice);
        vm.startPrank(alice);
        pixelStaking.stakePixel(pixelId, 100 ether, 0xFFFFFF);
        vm.stopPrank();

        uint256 newBalance = token.balanceOf(alice);
        (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
            pixelId
        );

        assertEq(previousBalance, newBalance + 100 ether);
        assertEq(owner, alice);
        assertEq(stake, 100 ether);
        assertEq(color, 0xFFFFFF);
    }

    function testOutbid() public {
        uint16 pixelId = 1234;
        // Alice stakes first
        vm.startPrank(alice);
        pixelStaking.stakePixel(pixelId, 100 ether, 0xFFFFFF);
        vm.stopPrank();

        // Bob outbids with 200
        vm.startPrank(bob);
        pixelStaking.stakePixel(pixelId, 200 ether, 0x000000);
        vm.stopPrank();

        (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
            pixelId
        );
        assertEq(owner, bob);
        assertEq(stake, 200 ether);
        assertEq(color, 0x000000);

        // Check that Alice got her 100 ether back
        assertEq(
            token.balanceOf(alice),
            1000 ether,
            "Alice should be refunded"
        );
    }

    function testChangePixelColor() public {
        uint16 pixelId = 1;
        uint256 previousBalance = token.balanceOf(alice);
        vm.startPrank(alice);
        pixelStaking.stakePixel(pixelId, 100 ether, 0xFF0000);
        pixelStaking.changePixelColor(pixelId, 0x00FF00);
        vm.stopPrank();

        uint256 newBalance = token.balanceOf(alice);
        (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
            pixelId
        );

        assertEq(previousBalance, newBalance + 100 ether);
        assertEq(owner, alice);
        assertEq(stake, 100 ether);
        assertEq(color, 0x00FF00);
    }

    function testStakePixels() public {
        uint16[] memory pixelIds = new uint16[](3);
        pixelIds[0] = 0;
        pixelIds[1] = 2;
        pixelIds[2] = 3;
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 ether;
        amounts[1] = 100 ether;
        amounts[2] = 100 ether;
        uint24[] memory colors = new uint24[](3);
        colors[0] = 0xFF0000;
        colors[1] = 0x00FF00;
        colors[2] = 0x0000FF;
        uint256 previousBalance = token.balanceOf(alice);
        vm.startPrank(alice);
        pixelStaking.stakePixels(pixelIds, amounts, colors);
        vm.stopPrank();

        uint256 newBalance = token.balanceOf(alice);
        uint256 delta = 0;
        for (uint16 i = 0; i < 3; i++) {
            delta += amounts[i];
            (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
                pixelIds[i]
            );
            assertEq(owner, alice);
            assertEq(stake, amounts[i]);
            assertEq(color, colors[i]);
        }

        assertEq(previousBalance, newBalance + delta);
    }

    function testUnstakePixels() public {
        uint16[] memory pixelIds = new uint16[](3);
        pixelIds[0] = 0;
        pixelIds[1] = 2;
        pixelIds[2] = 3;
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100 ether;
        amounts[1] = 100 ether;
        amounts[2] = 100 ether;
        uint24[] memory colors = new uint24[](3);
        colors[0] = 0xFF0000;
        colors[1] = 0x00FF00;
        colors[2] = 0x0000FF;
        uint256 previousBalance = token.balanceOf(alice);
        vm.startPrank(alice);
        pixelStaking.stakePixels(pixelIds, amounts, colors);
        vm.stopPrank();

        uint256 newBalance = token.balanceOf(alice);
        uint256 delta = 0;
        for (uint16 i = 0; i < 3; i++) {
            delta += amounts[i];
            (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
                pixelIds[i]
            );
            assertEq(owner, alice);
            assertEq(stake, amounts[i]);
            assertEq(color, colors[i]);
        }

        assertEq(previousBalance, newBalance + delta);

        vm.startPrank(alice);
        pixelStaking.unstakePixels(pixelIds);
        vm.stopPrank();

        for (uint16 i = 0; i < 3; i++) {
            (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
                pixelIds[i]
            );
            assertEq(owner, address(0));
            assertEq(stake, 0);
            assertEq(color, 0x000000);
        }
        newBalance = token.balanceOf(alice);

        assertEq(previousBalance, newBalance);
    }

    function testCannotUnderbid() public {
        uint16 pixelId = 1234;
        vm.startPrank(alice);
        pixelStaking.stakePixel(pixelId, 100 ether, 0xFFFFFF);
        vm.stopPrank();

        vm.startPrank(bob);
        vm.expectRevert(PixelStaking.InsufficientStakeAmount.selector);
        pixelStaking.stakePixel(pixelId, 50 ether, 0xFFFF00);
        vm.stopPrank();
    }

    function testUnstake() public {
        uint16 pixelId = 1234;
        uint256 previousBalance = token.balanceOf(alice);
        vm.startPrank(alice);
        pixelStaking.stakePixel(pixelId, 100 ether, 0xFFFFFF);
        pixelStaking.unstakePixel(pixelId);
        vm.stopPrank();

        uint256 newBalance = token.balanceOf(alice);
        (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
            pixelId
        );
        assertEq(owner, address(0));
        assertEq(stake, 0);
        assertEq(color, 0);

        // Alice should have her tokens back
        assertEq(previousBalance, newBalance);
    }
}
