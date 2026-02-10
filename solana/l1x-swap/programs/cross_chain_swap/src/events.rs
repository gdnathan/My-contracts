use anchor_lang::prelude::*;
use super::swap_accounts::SwapRequest;

#[event]
pub struct XTalkMessageBroadcasted {
    pub message: Vec<u8>,
    pub destination_network: String,
    pub destination_contract_address: String,
}

#[derive(Clone)]
#[event]
pub struct SwapInitiated {
    pub source_amount: u64,
    pub destination_amount: u64,
    pub sender_address: Pubkey,
    pub receiver_address: String,
    pub source_asset_address: Pubkey,
    pub destination_asset_address: String,
    pub destination_contract_address: String,
    pub source_asset_symbol: String,
    pub destination_asset_symbol: String,
    pub destination_network: String,
    pub conversion_rate_id: String,
    pub internal_id: String,
}

impl SwapInitiated {
    pub fn from_swap_request(swap_request: SwapRequest, sender_address: Pubkey) -> Self {
        Self {
            source_amount: swap_request.source_amount,
            destination_amount: swap_request.destination_amount,
            sender_address,
            receiver_address: swap_request.receiver_address,
            source_asset_address: swap_request.source_asset_address,
            destination_asset_address: swap_request.destination_asset_address,
            destination_contract_address: swap_request.destination_contract_address,
            source_asset_symbol: swap_request.source_asset_symbol,
            destination_asset_symbol: swap_request.destination_asset_symbol,
            destination_network: swap_request.destination_network,
            conversion_rate_id: swap_request.conversion_rate_id,
            internal_id: swap_request.internal_id,
        }
    }
}

#[event]
pub struct SwapFullfilled {
    pub global_tx_id: String,
    pub internal_id: String,
    pub amount: u64,
    pub receiver_address: Pubkey,
    pub asset_address: Pubkey,
    pub status: bool,
    pub status_message: String
}
