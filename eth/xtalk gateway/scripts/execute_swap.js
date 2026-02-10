// mint.js
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const L1XCrossChainLiquidityPool = await ethers.getContractFactory("L1XCrossChainLiquidityPool");
    const pool = L1XCrossChainLiquidityPool.attach("0xDa4140B906044aCFb1aF3b34C94A2803D90e96aA");

    // Prepare  payload
    const payload = {
        globalTxId: ethers.encodeBytes32String("Unique ID"), // make sure it's unique for each token
        user: deployer.address,
        tokenAddress: "0x4603e703309Cd6C0b8bada1e724312242ef36ECb",
        amount: ethers.parseUnits("1.0", 18),
        receivingAddress: "0xc31beb2a223435a38141Ee15C157672A9fA2997D",
    };

    // Get hash of the payload
    const payloadHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "address", "uint256", "address"],
        [payload.globalTxId, payload.user, payload.tokenAddress, payload.amount, payload.receivingAddress]
    );


    // Sign the payload hash
    const signature = await deployer.signMessage(ethers.getBytes(payloadHash));

    const overrides = {
        gasPrice: ethers.parseUnits('5', 'gwei') // Set your desired gas price here
    };

    const tx = await pool.executeSwap(payload, signature, overrides);
    await tx.wait();

    console.log("executeSwap tx:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
