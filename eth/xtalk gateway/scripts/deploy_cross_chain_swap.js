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

    const overrides = {
        gasPrice: ethers.parseUnits('5', 'gwei') // Set your desired gas price here
    };

    const LiquidityPool = await hre.ethers.getContractFactory("L1XCrossChainLiquidityPool");
    const lpool = await LiquidityPool.deploy("0x17e66991ac9be7599ec66c08e3b2d63254458549", "optimism", 10, overrides);

    await lpool.waitForDeployment();

    console.log("L1XCrossChainLiquidityPool contract deployed to:", await lpool.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});