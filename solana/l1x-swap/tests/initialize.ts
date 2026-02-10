import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet, web3, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { CrossChainSwap } from "../target/types/cross_chain_swap";
import fs from "fs";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

// Set the connection to the Solana network
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

// Load the wallet keypair from the file
// const walletKeypair = Keypair.fromSecretKey(
//   new Uint8Array(JSON.parse(fs.readFileSync("/home/erudyx/.config/solana/id.json", "utf8")))
// );
// const wallet = new Wallet(walletKeypair);
// const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
// anchor.setProvider(provider);
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

// Ensure the correct program ID and IDL are used
// const programId = new PublicKey("2XLRdv2GsdBPMP9abqucWc7b8N3PUGJKoRDahjxPZi4D");
// const idlString = fs.readFileSync("/home/user1/my-work/solana/target/idl/cross_chain_swap.json", "utf8");
// const idl = JSON.parse(idlString) as Idl;
// const program = new Program(idl, programId, provider);
const program = anchor.workspace.CrossChainSwap as Program<CrossChainSwap>;

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
  // Create new Keypairs for mint authorities
  const payerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from([
    91, 210, 56, 158, 57, 205, 248, 83, 32, 124, 230, 109, 12, 218, 32, 215, 28, 122, 243, 207,
    197, 31, 237, 129, 53, 161, 45, 136, 89, 190, 171, 144, 158, 57, 158, 25, 148, 159, 156,
    65, 250, 35, 213, 113, 38, 7, 67, 47, 40, 252, 187, 87, 116, 8, 76, 92, 54, 140, 144, 254,
    199, 219, 99, 55,
  ]));

  // Create all necessary mints
  const solMint = await createNewMint(provider, payerKeypair);
  const usdcMint = await createNewMint(provider, payerKeypair);
  const usdtMint = await createNewMint(provider, payerKeypair);

  // Generate the necessary PDAs
  const [stateAccount, stateBump] = await PublicKey.findProgramAddress(
    [Buffer.from("state_account")],
    program.programId
  );

  const [swapRequestAccount, swapRequestBump] = await PublicKey.findProgramAddress(
    [Buffer.from("swap_request_account")],
    program.programId
  );

  const [solAccount, solBump] = await PublicKey.findProgramAddress(
    [Buffer.from("sol_account")],
    program.programId
  );

  const [usdcAccount, usdcBump] = await PublicKey.findProgramAddress(
    [Buffer.from("usdc_account")],
    program.programId
  );

  const [usdtAccount, usdtBump] = await PublicKey.findProgramAddress(
    [Buffer.from("usdt_account")],
    program.programId
  );

  console.log("State Account:", stateAccount.toBase58());
  console.log("Swap Request Account:", swapRequestAccount.toBase58());
  console.log("SOL Account:", solAccount.toBase58());
  console.log("USDC Account:", usdcAccount.toBase58());
  console.log("USDT Account:", usdtAccount.toBase58());

  // Check if the wallet has sufficient funds, if not, airdrop SOL to the wallet
  const balance = await connection.getBalance(provider.wallet.publicKey);
  if (balance < web3.LAMPORTS_PER_SOL) {
    await airdropSol(connection, provider.wallet.publicKey);
  }

  // Initialize associated token accounts and fund them
  const solAssociatedAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerKeypair,
    solMint,
    stateAccount,
    true
  );

  const usdcAssociatedAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerKeypair,
    usdcMint,
    stateAccount,
    true
  );

  const usdtAssociatedAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payerKeypair,
    usdtMint,
    stateAccount,
    true
  );

  // Mint some tokens to the associated accounts for initial balance
  await mintTo(
    connection,
    payerKeypair,
    solMint,
    solAssociatedAccount.address,
    payerKeypair,
    1000000000 // 1 token with 9 decimals
  );

  await mintTo(
    connection,
    payerKeypair,
    usdcMint,
    usdcAssociatedAccount.address,
    payerKeypair,
    1000000000 // 1 token with 9 decimals
  );

  await mintTo(
    connection,
    payerKeypair,
    usdtMint,
    usdtAssociatedAccount.address,
    payerKeypair,
    1000000000 // 1 token with 9 decimals
  );

  try {
    const txHash = await program.methods.initialize(
      solMint, // Native asset address (SOL mint address)
      9, // Native asset decimals
      "Solana", // Source chain
      provider.wallet.publicKey, // Authorized L1 XGateway address (using wallet's public key for this example)
      [provider.wallet.publicKey, provider.wallet.publicKey], // Admin addresses (using wallet's public key for this example)
      provider.wallet.publicKey, // Treasury address (using wallet's public key for this example)
      10, // Treasury share percent
      new BN(1000), // Source native fee
      new BN(1000000), // SOL reserve amount
      new BN(1000000), // USDC reserve amount
      new BN(1000000) // USDT reserve amount
    ).accounts({
      stateAccount: stateAccount,
      swapRequestAccount: swapRequestAccount,
      payer: provider.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
      solMint: solMint,
      usdcMint: usdcMint,
      usdtMint: usdtMint,
      solAccount: solAccount,
      usdcAccount: usdcAccount,
      usdtAccount: usdtAccount,
      rent: web3.SYSVAR_RENT_PUBKEY,
    }).signers([payerKeypair])
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
}

// Example usage:
callInitialize().catch(err => console.error("Error calling initialize function:", err));
