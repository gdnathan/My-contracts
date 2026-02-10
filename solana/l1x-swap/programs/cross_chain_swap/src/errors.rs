use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("A swap request with this id already exists")]
    SwapRequestAlreadyExists,
    #[msg("Invalid amount for swap")]
    InvalidAmount,
    #[msg("Not enough funds")]
    NotEnoughFunds,
    #[msg("Swap request not found")]
    SwapRequestNotFound,
    #[msg("")]
    Any,
}
