// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import {PixelStaking} from "../src/PixelStaking.sol";
import {Token} from "../src/PXMTToken.sol";
import {ProjectFactory} from "../src/ProjectFactory.sol";

contract DeployPixel is Script {
    Token public token; // Replace with actual token address

    function run() external {
        vm.startBroadcast();
        token = new Token("PXMT", "PIXAMUT");
        console.log("Token deployed at:", address(token));

        address deployer = msg.sender;
        token.mint(deployer, 1_000_000 ether);

        PixelStaking pixelStaking = new PixelStaking(token, deployer);
        console.log("PixelStaking deployed at:", address(pixelStaking));

        ProjectFactory projectFactory = new ProjectFactory(
            address(token),
            address(pixelStaking),
            deployer
        );
        console.log("ProjectFactory deployed at:", address(projectFactory));
        vm.stopBroadcast();
    }
}
