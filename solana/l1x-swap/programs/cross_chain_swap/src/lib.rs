use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer as NativeTransfer};
use anchor_spl::token::{Transfer, TransferChecked, transfer_checked};
use serde::{Deserialize, Serialize};

mod swap_accounts;
use swap_accounts::SwapRequest;

mod instructions;
use instructions::*;

mod errors;
use errors::ErrorCode;

mod events;
use events::*;

declare_id!("BRYDWZ8qLKDjpdvAZTrDFTRwEqb65cPHHyVb2nPLWdTe");

#[program]
pub mod cross_chain_swap {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        native_asset_decimals: u8,
        authorized_lx_gateway: Pubkey,
        admins: Vec<Pubkey>,
        treasury_address: Pubkey,
        treasury_share_percent: u8,
        source_native_fee: u64,
    ) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;
        state_account.native_asset_decimals = native_asset_decimals as u32;
        state_account.authorized_l1x_gateway = authorized_lx_gateway;
        state_account.admins = admins;
        state_account.treasury_address = treasury_address;
        state_account.treasury_share_percent = treasury_share_percent as u32;
        state_account.source_native_fee = source_native_fee;

        Ok(())
    }

    pub fn initiate_swap_erc20(
        ctx: Context<InitiateSwapErc20>,
        internal_id: String,
        source_amount: u64,
        destination_amount: u64,
        receiver_address: String,
        source_asset_address: Pubkey,
        destination_asset_address: String,
        destination_contract_address: String,
        source_asset_symbol: String,
        destination_asset_symbol: String,
        destination_network: String,
        conversion_rate_id: String,
    ) -> Result<()> {
        let state_account = &ctx.accounts.state_account;

        // check that the signer have enough funds for the fees.
        require!(
            ctx.accounts.signer.get_lamports() >= state_account.source_native_fee,
            ErrorCode::NotEnoughFunds
        );

        if source_amount == 0 {
            return Err(ErrorCode::InvalidAmount.into());
        }

        let treasury_share = source_amount * state_account.treasury_share_percent as u64 / 100
            + state_account.source_native_fee;
        let program_share = source_amount - treasury_share;

        let transfer_instruction = Transfer {
            from: ctx.accounts.signer_token_account.to_account_info(),
            to: ctx.accounts.program_token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
            ),
            program_share,
        )?;

        let transfer_instruction = Transfer {
            from: ctx.accounts.signer_token_account.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_instruction,
            ),
            treasury_share,
        )?;

        let swap_request = SwapRequest {
            source_amount,
            destination_amount,
            sender_address: ctx.accounts.signer.key(),
            receiver_address,
            source_asset_address,
            destination_asset_address,
            source_asset_symbol,
            destination_asset_symbol,
            destination_contract_address: destination_contract_address.clone(),
            destination_network: destination_network.clone(),
            source_contract_address: *ctx.program_id,
            source_chain: "solana".to_string(),
            conversion_rate_id,
            internal_id,
        };

        emit!(XTalkMessageBroadcasted {
            message: borsh::to_vec(&swap_request).unwrap(),
            destination_network: destination_network.clone(),
            destination_contract_address: destination_contract_address.to_string(),
        });

        let swap_initiated = SwapInitiated::from_swap_request(
            swap_request,
            ctx.accounts.signer.key(),
        );
        emit!(swap_initiated.clone());

        let swap_data = &mut ctx.accounts.swap_data;
        swap_data.source_amount = swap_initiated.source_amount;
        swap_data.destination_amount = swap_initiated.destination_amount;
        swap_data.sender_address = swap_initiated.sender_address;
        swap_data.receiver_address = swap_initiated.receiver_address;
        swap_data.source_asset_address = swap_initiated.source_asset_address;
        swap_data.destination_asset_address = swap_initiated.destination_asset_address;
        swap_data.destination_contract_address = swap_initiated.destination_contract_address;
        swap_data.source_asset_symbol = swap_initiated.source_asset_symbol;
        swap_data.destination_asset_symbol = swap_initiated.destination_asset_symbol;
        swap_data.destination_network = swap_initiated.destination_network;
        swap_data.conversion_rate_id = swap_initiated.conversion_rate_id;
        swap_data.internal_id = swap_initiated.internal_id;

        Ok(())
    }

    pub fn initiate_swap_native(
        ctx: Context<InitiateSwapNative>,
        internal_id: String,
        source_amount: u64,
        destination_amount: u64,
        receiver_address: String,
        source_asset_address: Pubkey,
        destination_asset_address: String,
        destination_contract_address: String,
        source_asset_symbol: String,
        destination_asset_symbol: String,
        destination_network: String,
        conversion_rate_id: String,
    ) -> Result<()> {
        let state_account = &ctx.accounts.state_account;

        // check that the signer have enough funds for the fees + transfer
        require!(
            ctx.accounts.signer.get_lamports() >= source_amount + state_account.source_native_fee,
            ErrorCode::NotEnoughFunds
        );

        if source_amount == 0 || source_amount < state_account.source_native_fee {
            return Err(ErrorCode::InvalidAmount.into());
        }

        let treasury_share = source_amount * state_account.treasury_share_percent as u64 / 100
            + state_account.source_native_fee;
        let program_share = source_amount - treasury_share;

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            NativeTransfer {
                from: ctx.accounts.signer.to_account_info(),
                to: ctx.accounts.program_token_account.to_account_info(),
            },
        );
        transfer(cpi_context, program_share)?;

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            NativeTransfer {
                from: ctx.accounts.signer.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        );
        transfer(cpi_context, treasury_share)?;

        let swap_request = SwapRequest {
            source_amount,
            destination_amount,
            sender_address: ctx.accounts.signer.key(),
            receiver_address,
            source_asset_address,
            destination_asset_address,
            source_asset_symbol,
            destination_asset_symbol,
            destination_contract_address: destination_contract_address.clone(),
            destination_network: destination_network.clone(),
            source_contract_address: *ctx.program_id,
            source_chain: "solana".to_string(),
            conversion_rate_id,
            internal_id,
        };

        emit!(XTalkMessageBroadcasted {
            message: borsh::to_vec(&swap_request).unwrap(),
            destination_network: destination_network.clone(),
            destination_contract_address: destination_contract_address.to_string(),
        });

        let swap_initiated = SwapInitiated::from_swap_request(
            swap_request,
            ctx.accounts.signer.key(),
        );
        emit!(swap_initiated.clone());

        let swap_data = &mut ctx.accounts.swap_data;
        swap_data.source_amount = swap_initiated.source_amount;
        swap_data.destination_amount = swap_initiated.destination_amount;
        swap_data.sender_address = swap_initiated.sender_address;
        swap_data.receiver_address = swap_initiated.receiver_address;
        swap_data.source_asset_address = swap_initiated.source_asset_address;
        swap_data.destination_asset_address = swap_initiated.destination_asset_address;
        swap_data.destination_contract_address = swap_initiated.destination_contract_address;
        swap_data.source_asset_symbol = swap_initiated.source_asset_symbol;
        swap_data.destination_asset_symbol = swap_initiated.destination_asset_symbol;
        swap_data.destination_network = swap_initiated.destination_network;
        swap_data.conversion_rate_id = swap_initiated.conversion_rate_id;
        swap_data.internal_id = swap_initiated.internal_id;

        Ok(())
    }

    pub fn execute_swap_native(
        ctx: Context<ExecuteSwapNative>,
        internal_id: String,
        global_tx_id: String,
        message: Vec<u8>,
    ) -> Result<()> {
        #[derive(Serialize, Deserialize, PartialEq, Debug)]
        struct Data(u64, bool, String);

        let Data(amount, status, status_message) =
            bincode::deserialize(&message).unwrap();

        let seeds = &[
            "program_token_account".as_bytes(),
            &[ctx.bumps.program_token_account],
        ];
        let seeds_account = [&seeds[..]];
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            NativeTransfer {
                from: ctx.accounts.program_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
            },
            &seeds_account,
        );
        transfer(cpi_context, amount)?;

        emit!(SwapFullfilled {
            global_tx_id,
            internal_id,
            amount,
            receiver_address: ctx.accounts.user_token_account.key(),
            asset_address: Pubkey::default(),
            status,
            status_message,
        });

        Ok(())
    }

    pub fn execute_swap_erc20(
        ctx: Context<ExecuteSwapErc20>,
        internal_id: String,
        global_tx_id: String,
        message: Vec<u8>,
    ) -> Result<()> {
        #[derive(Serialize, Deserialize, PartialEq, Debug)]
        struct Data(u64, bool, String);


        msg!("we're in cpi!!!");

        let Data(amount, status, status_message) =
            bincode::deserialize(&message).unwrap();

        let seeds = &["state_account".as_bytes(), &[ctx.bumps.state_account]];
        let seeds_account = [&seeds[..]];

        msg!("gonna make the transfer");
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.program_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.state_account.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
            },
            &seeds_account,
        );
        transfer_checked(cpi_context, amount, ctx.accounts.token_mint.decimals)?;
        msg!("made the transfer !!!!!");

        emit!(SwapFullfilled {
            global_tx_id,
            internal_id,
            amount,
            receiver_address: ctx.accounts.user_token_account.key(),
            asset_address: ctx.accounts.token_mint.key(),
            status,
            status_message,
        });

        Ok(())
    }
}
