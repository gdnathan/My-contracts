#![feature(is_sorted)]

use anchor_lang::prelude::*;
use solana_program::hash::hash;
use solana_program::secp256k1_recover::secp256k1_recover;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
};

declare_id!("BWvy4WK74wCnEBvCv9a58iZmZ8jUhUz59a8czp2Ev7me");

#[program]
pub mod xtalk {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, initial_validators: Vec<Vec<u8>>) -> Result<()> {
        let mut initial_validators = initial_validators;
        initial_validators.iter_mut().for_each(|validator| {
            *validator = match validator.len() {
                33 => validator.to_vec(),
                64 => compress_pubkey(&validator).to_vec(),
                _ => panic!("Invalid public key length"),
            };
        });
        ctx.accounts.validators.validators = initial_validators;
        Ok(())
    }
    pub fn entrypoint(
        ctx: Context<Entrypoint>,
        data: Vec<u8>,
        signatures: Vec<Vec<u8>>,
    ) -> Result<()> {
        let validators = &ctx.accounts.validators.validators;
        let instruction = bincode::deserialize::<Instruction>(&data).expect("Invalid instruction");
        // get all the accounts passed in the instructions but the validators account
        let signer = ctx.accounts.signer.clone().to_account_info();
        let mut accounts = vec!();
        for account in ctx.remaining_accounts.iter() {
            unsafe { std::mem::transmute::<AccountInfo, AccountInfo>(account.clone()); }
        }
        accounts.push(signer.clone());
        let seeds = &["validators".as_bytes(), &[ctx.bumps.validators]];
        let seeds_account = [&seeds[..]];
        msg!("5");
        // invoke_signed(&instruction, &accounts, &seeds_account).expect("Failed to invoke instruction");
        invoke(&instruction, &accounts).expect("Failed to invoke instruction");
        msg!("6");
        Ok(())
    }
}

fn get_compression_flag(pubkey_bytes: &[u8]) -> u8 {
    let y_byte = pubkey_bytes[pubkey_bytes.len() - 1];
    if y_byte % 2 == 0 {
        0x02
    } else {
        0x03
    }
}

fn compress_pubkey(pubkey_bytes: &[u8]) -> Vec<u8> {
    let compression_flag = get_compression_flag(&pubkey_bytes);
    let mut compressed_pubkey = Vec::with_capacity(33);
    compressed_pubkey.push(compression_flag);
    compressed_pubkey.extend_from_slice(&pubkey_bytes[..32]);
    compressed_pubkey
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 324, seeds = [b"validators"], bump)]
    pub validators: Account<'info, Validators>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Entrypoint<'info> {
    #[account(seeds = [b"validators"], bump)]
    pub validators: Box<Account<'info, Validators>>,

    #[account(executable)]
    pub flow_program: AccountInfo<'info>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetCallers<'info> {
    #[account(mut, seeds = [b"validators"], bump)]
    pub validators: Account<'info, Validators>,
    pub signer: Signer<'info>,
}

#[account]
pub struct Validators {
    pub validators: Vec<Vec<u8>>, // 4 + (64 bytes per public key * 5 public keys) = 324 bytes
                                  // pub authorized_callers: Vec<Pubkey>,
                                  // pub owner: Pubkey,
}
