import { useCallback } from 'react';

import { getMessage } from 'lib/i18n';
import { Contact, useTempleClient } from 'lib/temple/front';

import { useFilteredContacts } from './use-filtered-contacts.hook';

export function useContacts() {
  const { updateSettings } = useTempleClient();
  const { contacts, allContacts } = useFilteredContacts();

  const addContact = useCallback(
    async (cToAdd: Contact) => {
      if (allContacts.some(c => c.accountId === cToAdd.accountId)) {
        throw new Error(getMessage('contactWithTheSameAddressAlreadyExists'));
      }
      await updateSettings({
        contacts: [cToAdd, ...contacts]
      });
    },
    [contacts, allContacts, updateSettings]
  );

  const removeContact = useCallback(
    async (accountId: string) =>
      updateSettings({
        contacts: contacts.filter(c => c.accountId !== accountId)
      }),
    [contacts, updateSettings]
  );

  const getContact = useCallback(
    (accountId: string) => allContacts.find(c => c.accountId === accountId) ?? null,
    [allContacts]
  );

  return {
    addContact,
    removeContact,
    getContact
  };
}

export const CONTACT_FIELDS_TO_SEARCH = ['name', 'accountId', 'rsAddress'] as const;

export function searchContacts<T extends Contact>(contacts: T[], searchValue: string) {
  if (!searchValue) return contacts;

  const loweredSearchValue = searchValue.toLowerCase();
  return contacts.filter(c =>
    CONTACT_FIELDS_TO_SEARCH.some(field => c[field].toLowerCase().includes(loweredSearchValue))
  );
}
