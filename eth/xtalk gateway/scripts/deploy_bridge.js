 // deploy.js
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    // getBalance is a method on the provider, not the signer
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    let one = "0x78e044394595d4984f66c1b19059bc14ecc24063";

    const L1XBridge = await hre.ethers.getContractFactory("xTalkGateway");
    const lpool = await L1XBridge.deploy([one]);

    await lpool.waitForDeployment();

    console.log("L1XBridge contract deployed to:", await lpool.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});

