

const hre = require("hardhat");

async function main() {

    const [deployer, second] = await hre.ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        second.address
    );

    // getBalance is a method on the provider, not the signer
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    const Bridge = await ethers.getContractFactory("L1XBridge");
    const bridge = Bridge.attach("0xF9c43D227C79dE9Cbe966E4530562010dDf30840");

    const addr_to_add = "0x0c47298d1323BeCDFfeEE568fb6970E52c6B655E";

    // const tx = await bridge.connect(deployer).add_authorized_signer(addr_to_add);
    // console.log("tx1:", tx);
    const tx2 = await bridge.connect(second).add_authorized_signer(addr_to_add);
    console.log("tx2:", tx2);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
