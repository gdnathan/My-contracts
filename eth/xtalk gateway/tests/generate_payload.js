const { ethers } = require("ethers");
const hre = require("hardhat");

async function main() {

  const contract = await hre.ethers.getContractFactory("L1XBridge");

  const [deployer, second] = await hre.ethers.getSigners();

  const global_tx_id = Buffer.from("0x66632c1d6b39ad1ca3457ba9b27360a111d449150c2998e72b2c21a2f3248797");

  const event_data = "0xffffffff";
  const contract_address = "0x604df657c9Dd8De7A1E0aCF6590Bb7C0516740ee";

  // Define the private keys
  const privateKeys = [
    "3c847c8759f82432084604228099e7b0b1270d296109ecf64a1497ea7f11bdca",
    "5bc2305abd6d09ac7163beb7170f4d1a3726203c10f0952c7a69d84493d39eb0",
    "75d2915022310aabbc897bfbc765a1cce73fcb73acb9b8c85c3873b7c7d6a9fc"
  ];

  // Sign the event_data with each private key
  // const signatures = privateKeys.map(privateKey => {
  //   const wallet = new ethers.Wallet(privateKey);
  //     let sig = await wallet.signMessage(event_data);
  //     return sig;
  // });
  let wallet1 = new ethers.Wallet(privateKeys[0]);
  let sig1 = await wallet1.signMessage(event_data);
  let wallet2 = new ethers.Wallet(privateKeys[1]);
  let sig2 = await wallet2.signMessage(event_data);
  let wallet3 = new ethers.Wallet(privateKeys[2]);
  let sig3 = await wallet3.signMessage(event_data);
  const signatures = [
    sig1,
    sig2,
    sig3
  ]
  console.log(signatures);

  // Get the bytecode of the contract call
  const bytecode = contract.interface.encodeFunctionData("entrypoint", [global_tx_id, event_data, contract_address, signatures]);

  console.log(bytecode);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
