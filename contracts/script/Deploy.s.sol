// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {MatchVault} from "../src/MatchVault.sol";

contract DeployMatchVault is Script {
    function run() external {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address resolver = vm.envAddress("RESOLVER_ADDRESS");

        vm.startBroadcast();
        MatchVault vault = new MatchVault(usdc, resolver);
        vm.stopBroadcast();

        console.log("MatchVault deployed at:", address(vault));
        console.log("  USDC:", usdc);
        console.log("  Resolver:", resolver);
    }
}
