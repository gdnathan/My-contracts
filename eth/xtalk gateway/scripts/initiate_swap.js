// mint.js
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const [deployer, user] = await ethers.getSigners();

    console.log("Deployer address:", deployer.address);

    const L1XToken = await ethers.getContractFactory("L1XToken");
    const token = L1XToken.attach("0x4603e703309Cd6C0b8bada1e724312242ef36ECb");

    const overrides = {
        gasPrice: ethers.parseUnits('5', 'gwei') // Set your desired gas price here
    };

    let tx = await token.connect(deployer).transfer(user.address, ethers.parseEther('10'), overrides);
    await tx.wait();

    tx = await token.connect(user).approve('0xDa4140B906044aCFb1aF3b34C94A2803D90e96aA',
                                              ethers.parseEther('10'), overrides);

    await tx.wait();
    console.log("approve tx:", tx.hash);

    const L1XCrossChainLiquidityPool = await ethers.getContractFactory("L1XCrossChainLiquidityPool");
    const pool = L1XCrossChainLiquidityPool.attach("0xDa4140B906044aCFb1aF3b34C94A2803D90e96aA");


    tx = await pool.connect(user).initiateSwap('0x4603e703309Cd6C0b8bada1e724312242ef36ECb',
                                                  ethers.parseEther('1'),
                                                  'ethereum',
                                                  '0x4603e703309Cd6C0b8bada1e724312242ef36ECb',
                                                  ethers.parseEther('1'),
                                                  user.address, overrides);

    await tx.wait();
    console.log("initiateSwap tx:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
