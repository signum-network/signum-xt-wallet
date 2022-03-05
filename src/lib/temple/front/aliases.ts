import { useCallback } from 'react';

import { Address, Alias } from '@signumjs/core';

import { useSignum } from './ready';

interface AliasList {
  aliases: Alias[];
}

export function useSignumAliasResolver() {
  const signum = useSignum();

  const resolveAccountPkToAlias = useCallback(
    async pk => {
      try {
        const account = Address.fromPublicKey(pk).getNumericId();
        const { aliases } = await signum.service.query<AliasList>('getAliases', { account });
        return aliases.find(({ account }) => account === pk)?.aliasName;
      } catch (e) {
        return null;
      }
    },
    [signum]
  );

  const resolveAliasToAccountPk = useCallback(
    async aliasName => {
      try {
        const { account } = await signum.alias.getAliasByName(aliasName);
        const acc = await signum.account.getAccount({
          accountId: account,
          includeEstimatedCommitment: false,
          includeCommittedAmount: false
        });
        // Account structure of SignumJS is inconsistent
        // @ts-ignore
        return acc.publicKey;
      } catch (e) {
        return null;
      }
    },
    [signum]
  );

  return {
    resolveAccountPkToAlias,
    resolveAliasToAccountPk
  };
}
