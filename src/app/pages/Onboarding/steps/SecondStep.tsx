import React, { FC } from 'react';

import { Button } from 'app/atoms/Button';
import Stamp from 'app/atoms/Stamp';

import { t, T } from '../../../../lib/i18n/react';
import ExploreButtonsImg from '../assets/explore-buttons.png';
import styles from '../Onboarding.module.css';

interface Props {
  nextStep: () => void;
}

const SecondStep: FC<Props> = ({ nextStep }) => {
  return (
    <>
      <p className={styles['title']}>
        <T id={'howToStartDetails'} />
      </p>
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'howToStartDescription1'} />
      </p>
      <p className={styles['description']} style={{ marginTop: 20 }}>
        <T id={'howToStartDescription2'} />
      </p>
      <div className={'relative'}>
        <Stamp label={t('example')} className={'top-1/2 right-3 opacity-25'} />
        <img src={ExploreButtonsImg} alt="ExploreButtonsImg" />
      </div>

      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'howToStartHint'} />
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

export default SecondStep;
