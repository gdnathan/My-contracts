// mint.js
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const L1XCrossChainLiquidityPool = await ethers.getContractFactory("L1XCrossChainLiquidityPool");
    const pool = L1XCrossChainLiquidityPool.attach("0xDa4140B906044aCFb1aF3b34C94A2803D90e96aA");

    const overrides = {
        gasPrice: ethers.parseUnits('5', 'gwei') // Set your desired gas price here
    };
    // Prepare  payload
    const payload = {
        globalTxId: "0xf0a80cf119b565f80ce3ba488172277f4e74565737ce4582f69cb7cadbb86c32", // make sure it's unique for each token
        user: "0xc31beb2a223435a38141Ee15C157672A9fA2997D",
    };

    // Get hash of the payload
    const payloadHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address"],
        [payload.globalTxId, payload.user]
    );

    // Sign the payload hash
    const signature = await deployer.signMessage(ethers.getBytes(payloadHash));

    const tx = await pool.confirmSwap(payload, signature, overrides);
    await tx.wait();

    console.log("confirmSwap tx:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
