import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet, web3, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, Commitment } from "@solana/web3.js";
import { CrossChainSwap } from "../target/types/cross_chain_swap";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, createAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import env from "./env";
import fs from 'fs';

const PATH_TO_KEYPAIR = "./id.json";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.CrossChainSwap as Program<CrossChainSwap>;
const connection = (program.provider as anchor.AnchorProvider).connection;

const [stateAccount, _stateBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("state_account")],
  program.programId
);

async function mintToProgram() {

  const raw_keypair = fs.readFileSync(PATH_TO_KEYPAIR, 'utf-8');
  const idljson = JSON.parse(raw_keypair);
  const payerKeypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(idljson));

  console.log("payerKeypair: ", payerKeypair.publicKey.toString());

  let myMint;
  try {
    let env_mint_address = new PublicKey(env.get("TOKEN_MINT"));

    const mintAccountInfo = await connection.getAccountInfo(env_mint_address);
    if (mintAccountInfo === null) {
      console.log("Mint account not found");
      throw new Error("Mint account not found");
    }
    myMint = env_mint_address;
    console.log("Mint account found: ", myMint.toString());
  } catch (_) {
    const mint_address = await createMint(connection, payerKeypair, payerKeypair.publicKey, null, 9);

    // this is to wait to be sure that the mint is created
    myMint = mint_address;
    env.set("TOKEN_MINT", myMint.toString());
    console.log("Mint account created: ", myMint.toString());
  }

  let programAssociatedAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerKeypair,
    myMint,
    stateAccount,
    true
  );
  console.log("Program associated account: ", programAssociatedAccount.address.toString(), " - owner: ", programAssociatedAccount.owner.toString());

  let userAssociatedAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerKeypair,
    myMint,
    payerKeypair.publicKey,
    true
  );
  console.log("User associated account: ", userAssociatedAccount.address.toString(), " - owner: ", userAssociatedAccount.owner.toString());

  console.log("program: ", await connection.getAccountInfo(programAssociatedAccount.address));
  // if (await connection.getAccountInfo(programAssociatedAccount) === null) {
  //   console.log("Creating program associated account");
  //   programAssociatedAccount = await createAccount(connection, payerKeypair, myMint, stateAccount);
  // };

  console.log("Program associated account: ", programAssociatedAccount.address.toString());

  mintTo(connection, payerKeypair, myMint, programAssociatedAccount.address, payerKeypair.publicKey, 10000000000000);

  console.log("Done !");
}

mintToProgram().catch(err => console.error("Error calling initialize function:", err));

