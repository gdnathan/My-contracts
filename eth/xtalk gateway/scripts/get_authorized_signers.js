
const hre = require("hardhat");

async function main() {
    const Bridge = await ethers.getContractFactory("L1XBridge");
    const bridge = Bridge.attach("0x8616495B6C5585443d011742554f56aF14AF8d64");

    const tx = await bridge.get_all_authorized_signers();
    console.log("authorized listeners:", tx);

    const storageValue = await bridge.isAuthorized("0xbD6Ca51fa3FEE45B0A6e6bf2134734Ce8cD4f5A1");
    console.log("isAuthorized:", storageValue);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
