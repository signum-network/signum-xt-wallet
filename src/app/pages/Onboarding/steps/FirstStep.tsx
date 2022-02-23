import React, { FC } from 'react';

import { Button } from 'app/atoms/Button';
import Stamp from 'app/atoms/Stamp';

import { T, t } from '../../../../lib/i18n/react';
import AddressBalanceImg from '../assets/address-balance.png';
import styles from '../Onboarding.module.css';

interface Props {
  nextStep: () => void;
}

const FirstStep: FC<Props> = ({ nextStep }) => {
  return (
    <>
      <p className={styles['title']}>
        <T id={'addressBalanceDetails'} />
      </p>
      <p className={styles['description']}>
        <T id={'addressBalanceDescription'} />
      </p>
      <div className={'relative'}>
        <Stamp label={t('example')} className={'top-1/2 right-3 opacity-25'} />
        <img src={AddressBalanceImg} alt="AddressBalanceImg" />
      </div>
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'addressBalanceHint'} />
      </p>
      <Button
        className="w-full justify-center border-none"
        style={{
          padding: '10px 2rem',
          background: '#4198e0',
          color: '#ffffff',
          marginTop: '40px',
          borderRadius: 4
        }}
        onClick={nextStep}
      >
        <T id={'next'} />
      </Button>
    </>
  );
};

export default FirstStep;
