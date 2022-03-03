import React, { FC } from 'react';

import { t, T } from 'lib/i18n/react';
import { useStorage } from 'lib/temple/front';
import { Link } from 'lib/woozie';

import Stepper from '../../atoms/Stepper';
import PageLayout from '../../layouts/PageLayout';
import CongratsPage from './pages/CongratsPage';
import FirstStep from './steps/FirstStep';
import FourthStep from './steps/FourthStep';
import SecondStep from './steps/SecondStep';
import ThirdStep from './steps/ThirdStep';

const Onboarding: FC = () => {
  const [step, setStep] = useStorage<number>(`onboarding_step_state`, 0);
  const Steps = [`${t('step')} 1`, `${t('step')} 2`, `${t('step')} 3`, `${t('step')} 4`];
  const MaxSteps = Steps.length;

  const nextStep = () => {
    setStep(Math.min(MaxSteps, step + 1));
  };
  return (
    <PageLayout
      pageTitle={
        <span style={step !== MaxSteps ? { marginLeft: 62 } : {}}>
          {step >= 1 ? <T id="onboarding" /> : <T id="welcomeToOnboarding" />}
        </span>
      }
      step={step}
      setStep={setStep}
      skip={step < MaxSteps}
    >
      <div className="mb-8 text-gray-600 text-right">
        <Link to="#/settings/general-settings">
          <T id="selectOtherLanguage" />
        </Link>
      </div>
      <div style={{ maxWidth: '360px', margin: 'auto' }} className="pb-8 text-justify">
        {step < MaxSteps && <Stepper style={{ marginTop: '40px' }} steps={Steps} currentStep={step} />}
        {step === 0 && <FirstStep nextStep={nextStep} />}
        {step === 1 && <SecondStep nextStep={nextStep} />}
        {step === 2 && <ThirdStep nextStep={nextStep} />}
        {step === 3 && <FourthStep nextStep={nextStep} />}
        {step === 4 && <CongratsPage />}
      </div>
    </PageLayout>
  );
};

export default Onboarding;
