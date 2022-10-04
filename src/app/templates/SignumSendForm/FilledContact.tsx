import React, { FC } from 'react';

import classNames from 'clsx';

import IdenticonSignum from 'app/atoms/IdenticonSignum';
import Money from 'app/atoms/Money';
import { Contact } from 'lib/messaging';
import { AssetMetadata } from 'lib/temple/metadata';

import Balance from '../Balance';

interface FilledContactProps {
  contact: Contact;
  metadata: AssetMetadata;
}

const FilledContact: FC<FilledContactProps> = ({ contact, metadata }) => (
  <div className="flex flex-wrap items-center">
    <IdenticonSignum address={contact.accountId} size={24} className="flex-shrink-0 shadow-xs opacity-75" />
    <div className="ml-1 mr-px font-normal">{contact.name}</div>(
    <Balance accountId={contact.accountId} tokenId={metadata.id}>
      {bal => (
        <span className={classNames('text-xs leading-none')}>
          <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>{metadata.symbol}</span>
        </span>
      )}
    </Balance>
    )
  </div>
);

export default FilledContact;
