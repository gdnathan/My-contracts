import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet, web3, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { CrossChainSwap } from "../target/types/cross_chain_swap";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import env from "./env";

const INTERNAL_ID = "1236";
const CONVERSION_RATE_ID = "0x";
const DESTINATION_NETWORK = "Arbitrum";

const SOURCE_AMOUNT = new BN(1_000_000_000);
const DESTINATION_AMOUNT = new BN(1_000_000_000);
const RECEIVER_ADDRESS = "4DA3A083831D9863b0C2bE734C351e6c0Cf83Fad";
const DESTINATION_CONTRACT = "845e0636f82ab39B531E2582b384B2d0e64d9e7A";
const SOURCE_SYMBOL = "sol";
const DESTINATION_SYMBOL = "eth";
const DESTINATION_ASSET_ADDRESS = "0x0000000000000000000000000000000000000000";


// Set the connection to the Solana network

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.CrossChainSwap as Program<CrossChainSwap>;
const connection = (program.provider as anchor.AnchorProvider).connection;

const [stateAccount, _stateBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("state_account")],
  program.programId
);

const [swapDataAccount, _dataBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("initiate-"), Buffer.from(INTERNAL_ID)],
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

  try {
    const txHash = await program.methods.initiateSwapNative(
      INTERNAL_ID, // internal_id
      SOURCE_AMOUNT, // Source native amount
      DESTINATION_AMOUNT, // Target native amount
      RECEIVER_ADDRESS,// receiver address
      PublicKey.default, // source asset address
      DESTINATION_ASSET_ADDRESS, // destination asset address
      DESTINATION_CONTRACT, // destination contract
      SOURCE_SYMBOL, // src symbol
      DESTINATION_SYMBOL, // dest symbol
      DESTINATION_NETWORK, // destination network
      CONVERSION_RATE_ID, // conversion rate id
    ).accounts({
      stateAccount: stateAccount,
      signer: provider.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
      programTokenAccount: programTokenAccount,
      swapData: swapDataAccount,
      treasury: treasury_pubkey,
    }).rpc();

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

