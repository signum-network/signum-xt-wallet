import React, { FC } from 'react';

import classNames from 'clsx';

import IdenticonSignum from 'app/atoms/IdenticonSignum';
import Money from 'app/atoms/Money';
import { Contact } from 'lib/messaging';

import Balance from '../Balance';

interface FilledContactProps {
  contact: Contact;
  assetSymbol: string;
}

const FilledContact: FC<FilledContactProps> = ({ contact, assetSymbol }) => (
  <div className="flex flex-wrap items-center">
    <IdenticonSignum accountId={contact.address} size={24} className="flex-shrink-0 shadow-xs opacity-75" />
    <div className="ml-1 mr-px font-normal">{contact.name}</div>(
    <Balance accountId={contact.address}>
      {bal => (
        <span className={classNames('text-xs leading-none')}>
          <Money>{bal}</Money> <span style={{ fontSize: '0.75em' }}>{assetSymbol}</span>
        </span>
      )}
    </Balance>
    )
  </div>
);

export default FilledContact;
