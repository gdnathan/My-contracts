import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet, web3, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { CrossChainSwap } from "../target/types/cross_chain_swap";
import env from "./env";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, createAccount } from "@solana/spl-token";
import fs from 'fs'

const PATH_TO_KEYPAIR = "./id.json";
const INTERNAL_ID = "1234";
const GLOBAL_TX_ID = "123456";
const PAYLOAD = Buffer.from("00c2eb0b00000000010500000000000000776f726c64", "hex");;

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.CrossChainSwap as Program<CrossChainSwap>;
const connection = (program.provider as anchor.AnchorProvider).connection;

const [stateAccount, _stateBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("state_account")],
  program.programId
);

const [programTokenAccount, _] = PublicKey.findProgramAddressSync(
  [Buffer.from("program_token_account")],
  program.programId
);

async function airdropSol(connection: Connection, publicKey: PublicKey) {
  const airdropSignature = await connection.requestAirdrop(publicKey, web3.LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSignature);
}

const treasury_pubkey = new PublicKey(env.get("TREASURY_PUBKEY"));
console.log("Treasury pubkey: ", treasury_pubkey.toString());

async function callInitSwap() {
  const raw_keypair = fs.readFileSync(PATH_TO_KEYPAIR, 'utf-8');
  const idljson = JSON.parse(raw_keypair)
  const payerKeypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(idljson));

  const balance = await connection.getBalance(provider.wallet.publicKey);
  if (balance < web3.LAMPORTS_PER_SOL) {
    await airdropSol(connection, provider.wallet.publicKey);
  }
  let our_balance = await connection.getBalance(provider.wallet.publicKey);
  console.log("Our balance: ", our_balance);
  let treasury_balance = await connection.getBalance(treasury_pubkey);
  console.log("Treasury balance: ", treasury_balance);
  let program_balance = await connection.getBalance(programTokenAccount);
  console.log("Program balance: ", program_balance);

  let myMint = new PublicKey(env.get("TOKEN_MINT"));

  await new Promise(f => setTimeout(f, 1000));
  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerKeypair,
    myMint,
    provider.wallet.publicKey,
    false,
    "finalized"
  );
  console.log("User token account: ", userTokenAccount.address.toString());
  await new Promise(f => setTimeout(f, 1000));

  const programAssociatedAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerKeypair,
    myMint,
    stateAccount,
    true,
    "finalized"
  );
  console.log("Program associated account: ", programAssociatedAccount.address.toString());
  await new Promise(f => setTimeout(f, 1000));

  // this payload can be generated using the local "utils" rust crate
  const payload = Buffer.from("00c2eb0b0000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000050000000000000068656c6c6f010500000000000000776f726c64", "hex");
  try {

    console.log("program program_token_account: ", programTokenAccount.toString());

    console.log(program.methods);
    const txHash = await program.methods.executeSwapErc20(
      INTERNAL_ID,
      GLOBAL_TX_ID,
      PAYLOAD
    ).accounts({
      stateAccount: stateAccount,
      programTokenAccount: programAssociatedAccount.address,
      user: provider.wallet.publicKey,
      tokenMint: myMint,
      userTokenAccount: userTokenAccount.address,
      gateway: payerKeypair.publicKey,
    })//.signers([payerKeypair]) // this is to include "gateway" as a signer
      .rpc();

    console.log("Transaction hash:", txHash);

    // Optional: Wait for confirmation
    await connection.confirmTransaction(txHash);
  } catch (err) {
    console.error("Error calling initialize function:", err);

    if (err.logs) {
      err.logs.forEach(log => console.error(log));
    }
  }

  let new_our_balance = await connection.getBalance(provider.wallet.publicKey);
  console.log("Our balance: ", new_our_balance);
  let new_treasury_balance = await connection.getBalance(treasury_pubkey);
  console.log("Treasury balance: ", new_treasury_balance);
  let new_program_balance = await connection.getBalance(programTokenAccount);
  console.log("Program balance: ", new_program_balance);
}

// Example usage:
callInitSwap().catch(err => console.error("Error calling initialize function:", err));

