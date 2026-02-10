const { ethers } = require("hardhat");
const { expect } = require("chai");


describe("L1XBridge", function() {
  let l1xbridge;
  let mockCalledContract;
  let owner, addr1, addr2, addr3;

  beforeEach(async function() {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    console.log("owner: ", owner.address);
    console.log("addr1: ", addr1.address);
    console.log("addr2: ", addr2.address);
    console.log("addr3: ", addr3.address);

    const L1XBridge = await ethers.getContractFactory("L1XBridge");
    l1xbridge = await L1XBridge.deploy([addr1, addr2])

    const MockCalledContract = await ethers.getContractFactory("MockContract");
    mockCalledContract = await MockCalledContract.deploy();
  });

  it("Should process entrypoint correclty", async function() {
    const global_tx_id = "some_tx_id";
    const decoded_data = mockCalledContract.interface.encodeFunctionData("callMe", []);
    // console.log("decoded : ", decoded_data);

    const contract_address = await mockCalledContract.getAddress();


    const hash = await l1xbridge.getPayloadHash(decoded_data);
    // console.log("hash: ", hash);


    const signature1 = await addr1.signMessage(ethers.getBytes(hash));
    // console.log("signature1: ", signature1)
    const signature2 = await addr2.signMessage(ethers.getBytes(hash));
    // console.log("signature2: ", signature2)

    // const data = Buffer.from(decoded_data.slice(2), "hex").toString('base64');
    // console.log(global_tx_id)
    // console.log(data)
    // console.log(contract_address)
    // console.log([signature1, signature2])

    // console.log("authorized: ", await l1xbridge.get_all_authorized_signers())
    const data = "e2ab228e66632c1d6b38ad1ca3457ba9b27360a111d449150c2998e72b2c21a2f32487970000000000000000000000000000000000000000000000000000000000000080000000000000000000000000604df657c9dd8de7a1e0acf6590bb7c0516740ee000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001446d32be5a000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090b4c303bf1e13b91213a8dc34768b0d1c3308c10000000000000000000000004da3a083831d9863b0c2be734c351e6c0cf83fad00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010066632c1d6b38ad1ca3457ba9b27360a111d449150c2998e72b2c21a2f32487970000000000000000000000000000000000000000000000000000000000000004555344540000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000075345504f4c494100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000410ac0dd1f2b1100cf8ff6674e5caa7234f143056b8afb7b94a59a7543ed834e52017af8c9015d794adfee680d2cd950bded5948c03e4e1e8228da2f6477b2c5e71c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041174b17c64ed4d4dd8b37665836d004fb6bf923d48aea194c8fbcb4504d1760700d204b8749707700a578318bbd4e4cc5a2161f55c629ee1e58555d67e196c9551c00000000000000000000000000000000000000000000000000000000000000";

    l1xbridge.on("LogBytes32", (sender, value) => {
      console.log(`Bytes32 emitted. Sender: ${sender}, Value: ${value}`);
    });
    l1xbridge.on("LogString", (sender, value) => {
      console.log(`String emitted. Sender: ${sender}, Value: ${value}`);
    });
    l1xbridge.on("LogBytes", (sender, value) => {
      console.log(`Bytes emitted. Sender: ${sender}, Value: ${value}`);
    });
    l1xbridge.on("LogAddress", (sender, value) => {
      console.log(`Address emitted. Sender: ${sender}, Value: ${value}`);
    });

    const sorted_array = [signature1, signature2].sort();

    await l1xbridge.entrypoint(global_tx_id, data, contract_address, sorted_array);

    expect(await l1xbridge.signer_transaction(owner)).to.equal(1);
    expect(await mockCalledContract.wasCalled()).to.be.true;
  });

  // it("Should revert consensus not reached", async function() {
  //   const global_tx_id = "some_tx_id";
  //   const decoded_data = mockCalledContract.interface.encodeFunctionData("callMe", []);
  //   const contract_address = await mockCalledContract.getAddress();
  //   const hash = await l1xbridge.getPayloadHash(decoded_data);
  //
  //   const signature1 = await addr1.signMessage(ethers.getBytes(hash));
  //
  //   const data = Buffer.from(decoded_data.slice(2), "hex").toString('base64');
  //
  //   expect(l1xbridge.entrypoint(global_tx_id, data, contract_address, [signature1])).to.be.revertedWith("Consensus not reached");
  //   expect(await l1xbridge.signer_transaction(owner)).to.equal(0);
  // })
  //
  // it("Should revert not authorized", async function() {
  //   const global_tx_id = "some_tx_id";
  //   const decoded_data = mockCalledContract.interface.encodeFunctionData("callMe", []);
  //   const contract_address = await mockCalledContract.getAddress();
  //   const hash = await l1xbridge.getPayloadHash(decoded_data);
  //
  //   const signature1 = await addr1.signMessage(ethers.getBytes(hash));
  //
  //   const data = Buffer.from(decoded_data.slice(2), "hex").toString('base64');
  //
  //   const b = await l1xbridge.connect(addr3)
  //
  //   expect(b.entrypoint(global_tx_id, data, contract_address, [signature1])).to.be.revertedWith("Not authorized");
  // })
  //
  // it("Should add new signer", async function() {
  //   expect(await l1xbridge.isAuthorized(addr3)).to.be.false;
  //
  //   await expect(l1xbridge.add_authorized_signer(addr3)).to.emit(l1xbridge, "AddVoteCasted").withArgs(owner.address, addr3.address);
  //   expect(await l1xbridge.isAuthorized(addr3)).to.be.false;
  //   expect(await l1xbridge.get_pending_authorized_signers(addr3)).to.be.equals(1);
  //
  //
  //   const b = await l1xbridge.connect(addr1)
  //   await expect(b.add_authorized_signer(addr3))
  //     .to.emit(l1xbridge, "AddVoteCasted").withArgs(addr1.address, addr3.address)
  //     .and.to.emit(l1xbridge, "SignerAdded").withArgs(addr3.address);
  //
  //   expect(await l1xbridge.isAuthorized(addr3)).to.be.true;
  //   expect(await l1xbridge.get_pending_authorized_signers(addr3)).to.be.equals(0);
  // })
  //
  // it("Should remove signer", async function() {
  //   expect(await l1xbridge.isAuthorized(addr2)).to.be.true;
  //
  //   await expect(l1xbridge.remove_authorized_signer(addr2)).to.emit(l1xbridge, "RemoveVoteCasted").withArgs(owner.address, addr2.address);
  //   expect(await l1xbridge.isAuthorized(addr2)).to.be.true;
  //   expect(await l1xbridge.get_pending_removal_signers(addr2)).to.be.equals(1);
  //
  //   const b = await l1xbridge.connect(addr1)
  //   await expect(b.remove_authorized_signer(addr2))
  //     .to.emit(l1xbridge, "RemoveVoteCasted").withArgs(addr1.address, addr2.address)
  //     .and.to.emit(l1xbridge, "SignerRemoved").withArgs(addr2.address);
  //
  //   expect(await l1xbridge.isAuthorized(addr2)).to.be.false;
  //   expect(await l1xbridge.get_pending_removal_signers(addr3)).to.be.equals(0);
  // })
  //
  // it("Should leave network", async function() {
  //   let c = await l1xbridge.connect(addr2)
  //   expect(await l1xbridge.isAuthorized(addr2)).to.be.true;
  //   await expect(await c.quit_network()).to.emit(l1xbridge, "SignerRemoved").withArgs(addr2.address);
  //   expect(await l1xbridge.isAuthorized(addr2)).to.be.false;
  //   let authorized = await l1xbridge.get_all_authorized_signers();
  //   expect(authorized.includes(addr2.address)).to.be.false;
  // })
  //
  // it("Should refuse duplicates in entrypoint", async function() {
  //   const global_tx_id = "some_tx_id";
  //   const decoded_data = mockCalledContract.interface.encodeFunctionData("callMe", []);
  //   const contract_address = await mockCalledContract.getAddress();
  //   const hash = await l1xbridge.getPayloadHash(decoded_data);
  //
  //   const signature1 = await addr1.signMessage(ethers.getBytes(hash));
  //   const signature2 = await addr2.signMessage(ethers.getBytes(hash));
  //
  //   const data = Buffer.from(decoded_data.slice(2), "hex").toString('base64');
  //
  //   expect(l1xbridge.entrypoint(global_tx_id, data, contract_address, [signature1, signature1, signature2])).to.be.revertedWith("Some signatures are not duplicates");
  //   expect(await l1xbridge.signer_transaction(owner)).to.equal(0);
  //   expect(await mockCalledContract.wasCalled()).to.be.false;
  // })
  //
  // it("Should refuse duplicates in vote to add", async function() {
  //   expect(await l1xbridge.isAuthorized(addr3)).to.be.false;
  //
  //   await expect(l1xbridge.add_authorized_signer(addr3)).to.emit(l1xbridge, "AddVoteCasted").withArgs(owner.address, addr3.address);
  //   await expect(l1xbridge.add_authorized_signer(addr3)).to.be.revertedWith("Already voted");
  // })
  //
  // it("Should refuse duplicates in vote to remove", async function() {
  //   expect(await l1xbridge.isAuthorized(addr3)).to.be.false;
  //
  //   await expect(l1xbridge.remove_authorized_signer(addr3)).to.emit(l1xbridge, "RemoveVoteCasted").withArgs(owner.address, addr3.address);
  //   await expect(l1xbridge.remove_authorized_signer(addr3)).to.be.revertedWith("Already voted");
  // })
});
/*

e2ab228e
66630c1d6b38ad1ca3457ba9b27360a111d449150c2998e72b2c21a2f3248797
0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000
604df657c9dd8de7a1e0acf6590bb7c0516740ee
000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001446d32be5a000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090b4c303bf1e13b91213a8dc34768b0d1c3308c10000000000000000000000004da3a083831d9863b0c2be734c351e6c0cf83fad00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010066630c1d6b38ad1ca3457ba9b27360a111d449150c2998e72b2c21a2f32487970000000000000000000000000000000000000000000000000000000000000004555344540000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000075345504f4c494100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000041c9fb8aa73239c494aee7230d7f4cd2a502b0bc8d09ffadbab47933f761e81f685c80444d6e89a5268a0c2b44a5e65e50c4173233a8536c2afae3484c47d0bc401b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041e83d7c43ebc667de2e3ed6cdd00eaf83c46a2f67fb9392e99b97599215aaf8ce620a333120f998d2d9409f1f46bddb78e5058caeea45a65b017da4b333563bb71c00000000000000000000000000000000000000000000000000000000000000


e2ab228e00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000100000000000000000000000000604df657c9dd8de7a1e0acf6590bb7c0516740ee00000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000042307836363633326331643662333961643163613334353762613962323733363061313131643434393135306332393938653732623263323161326633323438373937000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a30786666666666666666000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000413257f855e527c71e9ac758793638de49bb06ca07bb3986a4a40e931fecb3b4166bd770eca0e8578f31e593266b830fe2e4179fb672d864fd79aaed32de58b5b71b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000419f160d84b622af63b68f900566c9fa38b54b0feb65d70a5243ffcfa9e7acd56b00b106747609a140a01bded0c11c016756c387aa9675b9bd35cc019a9e2ccb581c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000411e045339af2084aac408c09deaaf206ad27cafc7115f50fad7c0f8a84ce1438f1391cd617aa744b69f82f906040dae16c549b862422d9310f7665d1f4956301c1c00000000000000000000000000000000000000000000000000000000000000





[226, 171, 34, 142]
66630c1d6b38ad1ca3457ba9b27360a111d449150c2998e72b2c21a2f3248797
6d32be5a000000000000000000000000000000000000000000000000000000000000000100000000000000000000000090b4c303bf1e13b91213a8dc34768b0d1c3308c10000000000000000000000004da3a083831d9863b0c2be734c351e6c0cf83fad00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010066630c1d6b38ad1ca3457ba9b27360a111d449150c2998e72b2c21a2f32487970000000000000000000000000000000000000000000000000000000000000004555344540000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000075345504f4c494100000000000000000000000000000000000000000000000000
0x604d…40ee

*/
