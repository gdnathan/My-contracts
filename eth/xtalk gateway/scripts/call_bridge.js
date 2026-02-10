const hre = require("hardhat");

async function main() {

  const [deployer, second] = await hre.ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  // getBalance is a method on the provider, not the signer
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const Bridge = await ethers.getContractFactory("L1XBridge");
  const bridge = Bridge.attach("0x0a6E8959960edFE556D7Ea4f1d7994560eAD560e");


  const global_tx_id = "0x66632c1d6b39ad1ca3457ba9b27360a111d449150c2998e72b2c21a2f3248797";

  const event_data = "0xffffffff";
  const contract_address = "0x604df657c9Dd8De7A1E0aCF6590Bb7C0516740ee";

  // Define the private keys
  const privateKeys = [
    "3c847c8759f82432084604228099e7b0b1270d296109ecf64a1497ea7f11bdca",
    "5bc2305abd6d09ac7163beb7170f4d1a3726203c10f0952c7a69d84493d39eb0",
    "75d2915022310aabbc897bfbc765a1cce73fcb73acb9b8c85c3873b7c7d6a9fc"
  ];

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

    signatures.sort();

  const tx2 = await bridge.connect(deployer).entrypoint(global_tx_id, event_data, contract_address, signatures)
  console.log("tx2:", tx2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
