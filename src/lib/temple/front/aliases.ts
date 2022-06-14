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
        const address = Address.fromPublicKey(pk);
        const accountId = address.getNumericId();
        const rs = address.getReedSolomonAddress();
        const { aliases } = await signum.service.query<AliasList>('getAliases', { account: accountId });
        const aliasPattern = new RegExp(`acct:${rs.toLowerCase()}@burst`);
        const accountsAliases = aliases.filter(({ aliasURI }) => aliasPattern.test(aliasURI));
        // Aliases are ordered by times - newest is last
        return accountsAliases.length ? accountsAliases[accountsAliases.length - 1].aliasName : null;
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
