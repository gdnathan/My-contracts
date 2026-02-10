import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Flow } from "../target/types/flow";

// const { Connection, AnchorProvider, Keypair, SystemProgram } = require("@solana/web3.js");
// const { Program, IDL } = require("@project-serum/anchor");


const connection = new anchor.web3.Connection("http://localhost:8899", "confirmed");
// const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
//
// const programId = new anchor.web3.PublicKey("/* Your program ID here */"); // Replace with actual program ID
//const program = new Program(idl, programId, provider);

const program = anchor.workspace.Flow as Program<Flow>;

async function callProgramFunction() {
  const data_account = anchor.web3.Keypair.generate();
  const payer = (program.provider as anchor.AnchorProvider).wallet;
  console.log("data_account", data_account.publicKey.toBase58());
  // const xtalk_wallet = anchor.workspace.Xtalk.provider.wallet;
  // const keypair = anchor.web3.Keypair.fromSecretKey(Buffer.from([91, 210, 56, 158, 57, 205, 248, 83, 32, 124, 230, 109, 12, 218, 32, 215, 28, 122, 243, 207, 197, 31, 237, 129, 53, 161, 45, 136, 89, 190, 171, 144, 158, 57, 158, 25, 148, 159, 156, 65, 250, 35, 213, 113, 38, 7, 67, 47, 40, 252, 187, 87, 116, 8, 76, 92, 54, 140, 144, 254, 199, 219, 99, 55]));
  // const provider = anchor.AnchorProvider.env();
  // const wallet = new anchor.Wallet(keypair);
  // console.log(xtalk_wallet.payer);
  // console.log(validators_account);
  // console.log(keypair);
  const txHash = await program.methods.initialize()
    .accounts({
      calledAccount: data_account.publicKey,
      payer: payer.publicKey
    })
    .signers([data_account])
    .rpc();
  console.log("Transaction hash:", txHash);
  // console.log("Transaction:", tx);

  // Optional: Wait for confirmation
  await connection.confirmTransaction(txHash);
}

// Example usage:
callProgramFunction();


