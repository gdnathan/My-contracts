import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { Flow } from "../target/types/flow";
// const web3 = require('@solana/web3.js');

// Define the Called account data structure
// const CalledAccountData = anchor.utils.struct([
//   anchor.bool('called'),
// ]);
//
// // Connect to the Solana cluster
// const connection = new web3.Connection('https://api.mainnet-beta.solana.com');
//
// // Provide the account address of the Called account
// const calledAccountAddress = 'YOUR_CALLED_ACCOUNT_ADDRESS';
//
// // Fetch the account data
// const accountData = await connection.getAccountInfo(new web3.PublicKey(calledAccountAddress));
//
// // Deserialize the account data
// const calledAccount = CalledAccountData.deserialize(accountData.data);
//
// // Access the called value
// const calledValue = calledAccount.called;
//
// console.log('Called value:', calledValue);
//
type CalledAccountData = {
  called: boolean;
};


const connection = new anchor.web3.Connection("http://localhost:8899", "confirmed");

const program = anchor.workspace.Flow as Program<Flow>;

async function callProgramFunction() {

  const calledAccountAddress = '7dRfCpeaxarqxk961Z4JDG14kdBFHESEKxZW1aurq2yj';
  let res = await program.account.called.fetch(calledAccountAddress);
  if (res.called) {
    console.log("yay !");
  } else {
      console.log("not yet");
  }
}

callProgramFunction();
