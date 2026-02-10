use anchor_lang::prelude::*;
use serde::{Deserialize, Serialize};

fn main() {
    #[derive(Serialize, Deserialize, PartialEq, Debug)]
    struct Data(u64, bool, String);

    let data = Data(200_000_000, true, "world".to_string());
    let data_bytes = bincode::serialize(&data).unwrap();
    let hex_data = hex::encode(data_bytes);

    println!("Data: {}", hex_data);
}
