// mint.js
const hre = require("hardhat");
const { ethers } = hre;

const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
async function main() {
    console.log(ethers.version);
    const [deployer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("L1XNFT");
    const token = Token.attach(TOKEN_ADDRESS);

    // Prepare mint payload
    const mintPayload = {
        globalTxID: ethers.encodeBytes32String("Unique ID"), // make sure it's unique for each token
        to: deployer.address, // address to which the token will be minted
        tokenURI: "https://my.tokenbase.io/token/1", // token URI
    };

    // Get hash of the payload
    // Get hash of the payload
    const payloadHash = ethers.solidityPackedKeccak256(
        ["bytes32", "address", "string"],
        [mintPayload.globalTxID, mintPayload.to, mintPayload.tokenURI]
    );

    // console.log(deployer.address);
    // console.log(await token.L1X_SYSTEM_ACCOUNT());

    // console.log(payloadHash == await token.getMintingPayloadHash(mintPayload));
    // console.log(deployer.address == await token.L1X_SYSTEM_ACCOUNT());

    // console.log(ethers.getBytes(payloadHash));
    // console.log(payloadHash);
    // Sign the payload hash
    const signature = await deployer.signMessage(payloadHash);

    // const signerAddr = ethers.verifyMessage(payloadHash, signature);
    // console.log(signerAddr);
    // Mint the token
    const tx = await token.mint(mintPayload, signature);
    const receipt = await tx.wait();

    console.log("Token minted tx:", tx.hash);
    console.log("Token minted receipt:", receipt.status);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
