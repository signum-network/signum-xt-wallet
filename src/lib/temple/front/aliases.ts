import { useCallback } from 'react';

import { Address, Alias } from '@signumjs/core';

import { useSignum } from './ready';

interface AliasList {
  aliases: Alias[];
}

function tryGetAccountIdFromAliasContent(content: string): string | null {
  let detectedAccount = '';
  try {
    // SRC44 standard
    const json = JSON.parse(content);
    detectedAccount = json.ac || '';
  } catch (e: any) {
    // legacy standard
    const result = /^acct:(s|ts|burst)-(?<address>.*)@burst$/gm.exec(content);
    if (result && result.groups) {
      detectedAccount = 's-' + result.groups.address || '';
    }
  }

  try {
    return detectedAccount.startsWith('s-')
      ? Address.fromReedSolomonAddress(detectedAccount).getNumericId()
      : Address.fromNumericId(detectedAccount).getNumericId();
  } catch (e: any) {
    return null;
  }
}

export function useSignumAliasResolver() {
  const signum = useSignum();

  const resolveAccountPkToAlias = useCallback(
    async pk => {
      try {
        const address = Address.fromPublicKey(pk);
        const accountId = address.getNumericId();
        const rs = address.getReedSolomonAddress(false);
        const { aliases } = await signum.service.query<AliasList>('getAliases', { account: accountId });
        // TODO: this legacy pattern is deprecated
        const aliasPattern = new RegExp(`acct:(s|ts|burst)-${rs.toLowerCase()}@burst`);
        const accountsAliases = aliases.filter(({ aliasURI }) => {
          try {
            // checking for SRC44 spec
            const json = JSON.parse(aliasURI);
            return json.ac === accountId;
          } catch (e) {
            return aliasPattern.test(aliasURI);
          }
        });
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
        if (aliasName.length < 2) {
          return null;
        }
        const { account, aliasURI } = await signum.alias.getAliasByName(aliasName);
        const accountId = tryGetAccountIdFromAliasContent(aliasURI);
        if (!accountId) return null;
        const acc = await signum.account.getAccount({
          accountId: account,
          includeEstimatedCommitment: false,
          includeCommittedAmount: false
        });
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
