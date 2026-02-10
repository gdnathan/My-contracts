use crate::swap_accounts::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

/// This instruction initiate the program account with
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Payer account to pay for the account creation
    #[account(mut, signer)]
    pub payer: Signer<'info>,

    /// Hold the state of our program
    #[account(
        init,
        payer = payer,
        space = StateAccount::LEN,
        seeds = [b"state_account"],
        bump,
    )]
    pub state_account: Box<Account<'info, StateAccount>>,

    /// store in the state the l1x authority we will use to validate treasury ATA
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(internal_id: String)]
pub struct InitiateSwapNative<'info> {
    #[account(seeds = [b"state_account"], bump)]
    pub state_account: Box<Account<'info, StateAccount>>,
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        constraint = treasury.key() == state_account.treasury_address,
    )]
    pub treasury: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"program_token_account"],
        bump,
    )]
    pub program_token_account: SystemAccount<'info>, // don't I need to initiate this ??
    #[account(
        init,
        payer = signer,
        space = SwapInitiatedAccount::LEN,
        seeds = [b"initiate-", internal_id.as_bytes()],
        bump,
        )]
    pub swap_data: Box<Account<'info, SwapInitiatedAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(internal_id: String)]
pub struct InitiateSwapErc20<'info> {
    #[account(seeds = [b"state_account"], bump)]
    pub state_account: Box<Account<'info, StateAccount>>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = signer
    )]
    pub signer_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = state_account.treasury_address,
    )]
    pub treasury: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = state_account
    )]
    pub program_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = signer,
        space = SwapInitiatedAccount::LEN,
        seeds = [b"initiate-", internal_id.as_bytes()],
        bump,
        )]
    pub swap_data: Box<Account<'info, SwapInitiatedAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ExecuteSwapNative<'info> {
    #[account(seeds = [b"state_account"], bump)]
    pub state_account: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [b"program_token_account"],
        bump,
    )]
    pub program_token_account: SystemAccount<'info>,
    #[account(mut)]
    pub user_token_account: SystemAccount<'info>,
    pub token_program: Program<'info, Token>,
    #[account(executable)]
    pub system_program: Program<'info, System>,
    #[account(constraint = signer.key() == state_account.authorized_l1x_gateway)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteSwapErc20<'info> {
    #[account(seeds = [b"state_account"], bump)]
    pub state_account: Box<Account<'info, StateAccount>>,
    #[account(mut)]
    pub user: SystemAccount<'info>,

    pub token_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority =
        user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = state_account
    )]
    pub program_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    #[account(constraint = signer.key() == state_account.authorized_l1x_gateway)]
    pub signer: Signer<'info>,
}
