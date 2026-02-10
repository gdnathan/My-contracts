import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet, web3, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { CrossChainSwap } from "../target/types/cross_chain_swap";
import fs from "fs";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import env from "./env";

// if not using gatway, set to the public key of YOUR ACCOUNT (run `solana address` to get it)
// const L1X_GATEWAY = new PublicKey("J4AyQSa8oVBq3V7pqbbGs8yYDzahjtDFF7yZgsrDazfF");



// SET THIS TO THE PUBLIC KEY USED BY XTALK (it's probably this one unless you changed it)
const XTALK_SIGNER = new PublicKey("BeeNfY43m8n6qEHqG1sCTif4rvTo3iRCVo3NTNH5A3mG")
const ADMINS = []
let random_treasury = Keypair.generate();
// ----------------------
const TREASURY = random_treasury.publicKey;
// if you need to set your own treasury, uncomment this instead:
// const TREASURY = new PublicKey("11111111111111111111111111111111");
// ----------------------
const TREASURY_SHARE_PERCENT = 10;
const SRC_NATIVE_FEE = new BN(100_000_000);

// env.set("L1X_GATEWAY", L1X_GATEWAY.toBase58());

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.CrossChainSwap as Program<CrossChainSwap>;
const connection = (program.provider as anchor.AnchorProvider).connection;

async function createNewMint(provider: AnchorProvider, authority: Keypair): Promise<PublicKey> {
  const mint = await createMint(
    provider.connection,
    authority,
    authority.publicKey,
    null,
    9
  );
  return mint;
}

async function airdropSol(connection: Connection, publicKey: PublicKey) {
  const airdropSignature = await connection.requestAirdrop(publicKey, web3.LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSignature);
}

async function callInitialize() {

  const [stateAccount, _stateBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("state_account")],
    program.programId,
  );

  const [programTokenAccount, _programBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_native_account")],
    program.programId
  );

  // const [gatewaySigner, _e] = PublicKey.findProgramAddressSync(
  //   [Buffer.from("validators")],
  //   L1X_GATEWAY
  // );


  console.log("State Account:", stateAccount.toBase58());
  console.log("Program Token Account:", programTokenAccount.toBase58());

  const balance = await connection.getBalance(provider.wallet.publicKey);
  if (balance < web3.LAMPORTS_PER_SOL) {
    await airdropSol(connection, provider.wallet.publicKey);
  }

  env.set("TREASURY_PUBKEY", TREASURY.toBase58());

  try {
    const txHash = await program.methods.initialize(
      9, // Native asset decimals
      XTALK_SIGNER, // Authorized L1 XGateway address (using wallet's public key for this example)
      ADMINS, // Admin addresses (using wallet's public key for this example)
      TREASURY, // Treasury address
      TREASURY_SHARE_PERCENT, // Treasury share percent
      SRC_NATIVE_FEE, // Source native fee
    ).accounts({
      payer: provider.wallet.publicKey,
      stateAccount: stateAccount,
    }).rpc();

    console.log("publick key:", provider.wallet.publicKey);
    console.log("Transaction hash:", txHash);

    // Optional: Wait for confirmation
    await connection.confirmTransaction(txHash);
  } catch (err) {
  console.log("publick key:", provider.wallet.publicKey);
    console.error("Error calling initialize function:", err);

    if (err.logs) {
      err.logs.forEach(log => console.error(log));
    }
  }
}

// Example usage:
callInitialize().catch(err => console.error("Error calling initialize function:", err));

