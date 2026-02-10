use anchor_lang::prelude::*;

declare_id!("5HiuTsYsGPGMdBN2J4yoLdyQEfWANBat1tSa9wxYzihS");

#[program]
pub mod flow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>,) -> Result<()> {
        ctx.accounts.called_account.called = false;
        Ok(())
    }

    pub fn emit_event(_ctx: Context<EmitEvent>, message: String) -> Result<()> {
        // let destination_contract = "8f6b536f3552d97198faec8dd7cb2fb59d36cdb3".to_string();
        let global_transaction_id = "0123456789abcdef".to_string();
        emit!(EmittedEvent {
            global_transaction_id,
            data: message.as_bytes().to_vec()
        });
        Ok(())
    }

    pub fn call(ctx: Context<Call>,) -> Result<()> {
        ctx.accounts.called_account.called = true;
        emit!(FunctionCalled {});
        Ok(())
    }
}

#[derive(Accounts)]
pub struct EmitEvent<'info> {
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + 1 + 3)]
    pub called_account: Account<'info, Called>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Call<'info> {
    #[account(mut)]
    pub called_account: Account<'info, Called>,
}

#[account]
pub struct Called {
    pub called: bool, // 1, padding 3
}

#[event]
pub struct EmittedEvent {
    pub global_transaction_id: String,
    pub data: Vec<u8>,
}

#[event]
pub struct FunctionCalled {
}
