import { generateSignumMnemonic } from '../signumMnemonic';

describe('signumMnemonic', () => {
  // just a smoke test that does not test randomness at all.
  it('should generate random passphrases - this is a long running test', async () => {
    const mSet = new Set<string>();
    for (let i = 0; i < 10_000; ++i) {
      const mnemonic = await generateSignumMnemonic();
      if (mSet.has(mnemonic)) {
        fail('Got same mnemonic');
        return;
      }
      mSet.add(mnemonic);
    }
  });
});
