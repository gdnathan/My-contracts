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
  const payer = (program.provider as anchor.AnchorProvider).wallet;
  const txHash = await program.methods.emitEvent("Hello, world!")
    .accounts({
      payer: payer.publicKey
    })
    .rpc();
  console.log("Transaction hash:", txHash);
  // console.log("Transaction:", tx);

  // Optional: Wait for confirmation
  console.log("confirmation:" , await connection.confirmTransaction(txHash));
}

// Example usage:
callProgramFunction();


