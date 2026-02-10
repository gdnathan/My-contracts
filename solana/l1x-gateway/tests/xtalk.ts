import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Xtalk } from "../target/types/xtalk";

describe("xtalk", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Xtalk as Program<Xtalk>;

  it("Is initialized!", async () => {
    const programKeypair = anchor.web3.Keypair.generate();
    const payer = (program.provider as anchor.AnchorProvider).wallet
    const initial_validators = [
        Buffer.from([0, 1, 2, 3])
    ]

    await program.methods.initialize(initial_validators)
    .accounts({
        validatorsAccount: programKeypair.publicKey,
        payer: payer.publicKey
    })
    .signers([programKeypair])
    .rpc()
  });
});
