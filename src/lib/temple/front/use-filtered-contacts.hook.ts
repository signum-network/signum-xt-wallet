import { useMemo } from 'react';

import { Address } from '@signumjs/core';

import { Contact } from 'lib/messaging';
import { useSignumAccountPrefix } from 'lib/temple/front/network';

import { useTempleClient } from './client';
import { useRelevantAccounts, useSettings } from './ready';

export function useFilteredContacts() {
  const { updateSettings } = useTempleClient();
  const prefix = useSignumAccountPrefix();
  const settings = useSettings();
  const settingContacts = useMemo(() => settings.contacts ?? [], [settings.contacts]);

  const accounts = useRelevantAccounts();
  const accountContacts = useMemo<Contact[]>(
    () =>
      accounts.map(acc => {
        const address = Address.fromPublicKey(acc.publicKey, prefix);
        return {
          accountId: address.getNumericId(),
          rsAddress: address.getReedSolomonAddress(),
          name: acc.name,
          accountInWallet: true
        };
      }),
    [accounts]
  );

  const allContacts = useMemo(() => {
    const filteredSettingContacts = settingContacts.filter(
      contact => !accountContacts.some(intersection => contact.accountId === intersection.accountId)
    );

    if (filteredSettingContacts.length !== settingContacts.length) {
      updateSettings({ contacts: filteredSettingContacts });
    }

    return [...filteredSettingContacts, ...accountContacts];
  }, [settingContacts, accountContacts, updateSettings]);

  return { contacts: settingContacts, allContacts };
}
