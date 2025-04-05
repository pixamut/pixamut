// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../src/Project.sol";
import "../src/PixelStaking.sol";
import "../src/PXMTToken.sol";
import {ProjectFactory} from "../src/ProjectFactory.sol";

contract ProjectTest is Test {
    Project public project;
    ProjectFactory public projectFactory;
    PixelStaking public pixelStaking;
    Token public token;

    address admin = makeAddr("admin");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        token = new Token("PXMT", "PIXAMUT");
        pixelStaking = new PixelStaking(IERC20(address(token)), admin);
        projectFactory = new ProjectFactory(
            address(token),
            address(pixelStaking),
            admin
        );
        vm.deal(admin, 1 ether); // Make sure admin has ETH to send
        vm.startPrank(admin);
        project = Project(
            payable(projectFactory.createProject{value: 0.5 ether}("test", ""))
        );
        vm.stopPrank();

        // Mint some tokens to testors
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);

        // approve
        vm.startPrank(alice);
        token.approve(address(pixelStaking), type(uint256).max);
        token.approve(address(project), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(bob);
        token.approve(address(pixelStaking), type(uint256).max);
        token.approve(address(project), type(uint256).max);
        vm.stopPrank();
    }

    function testDeposit() public {
        vm.startPrank(alice);
        uint256 amount = 100 ether;
        project.deposit(amount);
        vm.stopPrank();

        assertEq(project.userBalance(alice), amount);
        assertEq(token.balanceOf(address(project)), amount);
    }

    function testStakePixelsAsOwner() public {
        vm.startPrank(alice);
        uint256 amount = 300 ether;
        project.deposit(amount);
        vm.stopPrank();

        vm.startPrank(admin);
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

        project.stakePixels(pixelIds, amounts, colors);
        vm.stopPrank();

        for (uint16 i = 0; i < 3; i++) {
            (address owner, uint24 color, uint256 stake) = pixelStaking.pixels(
                pixelIds[i]
            );
            assertEq(owner, address(project));
            assertEq(stake, amounts[i]);
            assertEq(color, colors[i]);
        }
    }

    function testWithdrawWithUnstake() public {
        uint256 previousBalance = token.balanceOf(alice);
        vm.startPrank(alice);
        uint256 amount = 500 ether;
        project.deposit(amount);
        vm.stopPrank();

        vm.startPrank(admin);
        uint16[] memory pixelIds = new uint16[](2);
        pixelIds[0] = 1;
        pixelIds[1] = 2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 200 ether;
        amounts[1] = 100 ether;

        uint24[] memory colors = new uint24[](2);
        colors[0] = 0xFFFFFF;
        colors[1] = 0x000000;

        project.stakePixels(pixelIds, amounts, colors);
        vm.stopPrank();

        vm.startPrank(alice);
        uint16 unstakeId = 0;

        project.withdraw(200 ether, unstakeId);
        assertEq(token.balanceOf(alice), previousBalance - 300 ether);
        vm.stopPrank();
    }

    function testWithdrawWithUnstakeNeeded() public {
        uint256 previousBalance = token.balanceOf(alice);
        vm.startPrank(alice);
        uint256 amount = 500 ether;
        project.deposit(amount);
        vm.stopPrank();

        vm.startPrank(admin);
        uint16[] memory pixelIds = new uint16[](2);
        pixelIds[0] = 1;
        pixelIds[1] = 2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 200 ether;
        amounts[1] = 300 ether;

        uint24[] memory colors = new uint24[](2);
        colors[0] = 0xFFFFFF;
        colors[1] = 0x000000;

        project.stakePixels(pixelIds, amounts, colors);
        vm.stopPrank();

        vm.startPrank(alice);
        uint16 unstakeId = 1;

        project.withdraw(200 ether, unstakeId);
        assertEq(token.balanceOf(alice), previousBalance - 300 ether);
        vm.stopPrank();
    }

    function testOnlyOwnerCanStakePixels() public {
        vm.startPrank(alice);
        uint16[] memory pixelIds = new uint16[](1);
        pixelIds[0] = 1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100 ether;
        uint24[] memory colors = new uint24[](1);
        colors[0] = 0xFF0000;

        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                alice
            )
        );
        project.stakePixels(pixelIds, amounts, colors);
        vm.stopPrank();
    }

    function testWithdrawFailsIfInsufficientBalance() public {
        vm.startPrank(alice);
        uint256 amount = 100 ether;
        project.deposit(amount);

        vm.expectRevert(Project.InsufficientUserBalance.selector);
        project.withdraw(200 ether, 0);
        vm.stopPrank();
    }
}
