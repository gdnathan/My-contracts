import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Xtalk } from "../target/types/xtalk";
import * as bs58 from 'bs58';

// const { Connection, AnchorProvider, Keypair, SystemProgram } = require("@solana/web3.js");
// const { Program, IDL } = require("@project-serum/anchor");


const connection = new anchor.web3.Connection("http://localhost:8899", "confirmed");
// const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
//
// const programId = new anchor.web3.PublicKey("/* Your program ID here */"); // Replace with actual program ID
//const program = new Program(idl, programId, provider);

const program = anchor.workspace.Xtalk as Program<Xtalk>;

async function callProgramFunction() {

  const payer = (program.provider as anchor.AnchorProvider).wallet;

  const validators_account = new anchor.web3.PublicKey("ExBGA1XEPb2j4qxCEhPodVPPSVJYw3CmH6qGjKKLUeoH")
  // const v2 = Buffer.from("CyUCWjvLQcBAQmY5zf1B3c7FwjTESVwt9G6YiPYdT2h4", "base58");
  // const v = anchor.web3.PublicKey.decode(v2)
  // const validators_account = "CyUCWjvLQcBAQmY5zf1B3c7FwjTESVwt9G6YiPYdT2h4";
  const data = Buffer.from("e4000d93bb4306a2a648f96be89ab264904e05543eacd6479f433a0bc390121f000000000000000009000000000000000500000048656c6c6f", "hex");
  const signature = Buffer.from("7105c0d6b246e851270e9090c88d4561fac3bf55993ae237868083addb5837f07cc241b18814c64f3d90528b0017e39b1e5a07e16a09034f847a4491077f8f83", "hex");

  const txHash = await program.methods.entrypoint(data, [signature])
    .accounts({
      validators: validators_account,
      // payer: payer.publicKey
    })
    // .signers([validators_account])
    .rpc();
  console.log("Transaction hash:", txHash);
  // console.log("Transaction:", tx);

  // Optional: Wait for confirmation
  await connection.confirmTransaction(txHash);
}

// Example usage:
callProgramFunction();


