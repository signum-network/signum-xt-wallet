import React, { FC } from 'react';

import { Button } from 'app/atoms/Button';
import Stamp from 'app/atoms/Stamp';

import { t, T } from '../../../../lib/i18n/react';
import ProfileRpcImg from '../assets/profile-rpc.png';
import styles from '../Onboarding.module.css';

interface Props {
  nextStep: () => void;
}

const FourthStep: FC<Props> = ({ nextStep }) => {
  return (
    <>
      <p className={styles['title']}>
        <T id={'profileRpcDetails'} />
      </p>
      <p className={styles['description']}>
        <T id={'profileRpcDescription'} />
      </p>
      <div className={'relative'}>
        <Stamp label={t('example')} className={'top-0 opacity-25'} style={{ left: '33%' }} />
        <img src={ProfileRpcImg} alt="ProfileRpcImg" />
      </div>
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'profileRpcHint1'} />
      </p>
      <p className={styles['description']} style={{ marginTop: 20, marginBottom: 0 }}>
        <T id={'profileRpcHint2'} />
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
        <T id={'done'} />
      </Button>
    </>
  );
};

export default FourthStep;
