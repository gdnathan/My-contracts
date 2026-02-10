// mint.js
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const [deployer, user] = await ethers.getSigners();

    console.log("Deployer address:", deployer.address);

    const L1XToken = await ethers.getContractFactory("L1XToken");
    const token = L1XToken.attach("0x853f409f60D477b5e4ECdfF2f2094D4670AFA0A1");

    const overrides = {
        gasPrice: ethers.parseUnits('5', 'gwei') // Set your desired gas price here
    };

    let tx = await token.connect(deployer).transfer("0x44436A43330122a61A4877E51bA54084D5BD0aC6",
        ethers.parseEther('100'),
        overrides);

    await tx.wait();

    console.log("transfer tx:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
