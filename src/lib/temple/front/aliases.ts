import { useCallback } from 'react';

import { Alias } from '@signumjs/core';

import { useSignum } from './ready';

interface AliasList {
  aliases: Alias[];
}

export function useSignumAliasResolver() {
  const signum = useSignum();

  const resolveAccountIdToAlias = useCallback(
    async accountId => {
      try {
        const { aliases } = await signum.service.query<AliasList>('getAliases', { account: accountId });
        return aliases.find(({ account }) => account === accountId)?.aliasName;
      } catch (e) {
        return null;
      }
    },
    [signum]
  );

  const resolveAliasToAccountId = useCallback(
    async aliasName => {
      try {
        const { account } = await signum.alias.getAliasByName(aliasName);
        return account;
      } catch (e) {
        return null;
      }
    },
    [signum]
  );

  return {
    resolveAccountIdToAlias,
    resolveAliasToAccountId
  };
}
