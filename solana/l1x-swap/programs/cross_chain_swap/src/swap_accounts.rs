use anchor_lang::prelude::*;

#[account]
pub struct StateAccount {
    pub native_asset_decimals: u32,
    pub authorized_l1x_gateway: Pubkey,
    pub admins: Vec<Pubkey>,
    pub treasury_address: Pubkey,
    pub treasury_share_percent: u32,
    pub source_native_fee: u64,
}

impl StateAccount {
    pub const LEN: usize =
        4 + // u32
        32 + // Pubkey
        4 + 32 * 5 + // Vec<Pubkey>
        32 + // Pubkey
        4 + // u32
        8; // u64
} // total 244 bytes

#[account]
pub struct SwapRequest {
    pub source_amount: u64, // 8
    pub destination_amount: u64, // 8
    pub sender_address: Pubkey, // 32
    pub receiver_address: String, // 32
    pub source_asset_address: Pubkey,
    pub destination_asset_address: String,
    pub destination_contract_address: String,
    pub source_asset_symbol: String,
    pub destination_asset_symbol: String,
    pub source_chain: String,
    pub source_contract_address: Pubkey,
    pub destination_network: String,
    pub conversion_rate_id: String,
    pub internal_id: String,
}

#[account]
pub struct SwapExecuted {
    pub global_tx_id: String,
    pub internal_id: String,
    pub amount: u64,
    pub receiver_address: Pubkey,
    pub asset_address: Pubkey,
    pub status: bool,
    pub status_message: String
}

impl SwapExecuted {
    pub const LEN: usize =
        4 + 32 + // 32 bytes String
        4 + 32 + // 32 bytes String
        8 + // u64
        32 + // Pubkey
        32 + // Pubkey
        1 + // bool
        4 + 10; // 10 bytes String
} // total 159 bytes

#[account]
pub struct SwapInitiatedAccount {
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

impl SwapInitiatedAccount {
    pub const LEN: usize =
        8 + // u64
        8 + // u64
        32 + // Pubkey
        4 + 32 + // String
        4 + 32 + // Pubkey
        4 + 32 + // String
        4 + 32 + // String
        4 + 3 + // String
        4 + 3 + // String
        4 + 10 + // String
        4 + 32 + // String
        4 + 32; // String
} // total 292 bytes
