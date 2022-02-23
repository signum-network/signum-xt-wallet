import React, { FC } from 'react';

import LocaleSelect from 'app/templates/LocaleSelect';
import LockUpSettings from 'app/templates/LockUpSettings';
import PopupSettings from 'app/templates/PopupSettings';
import ResetSettings from 'app/templates/ResetSettings';

const GeneralSettings: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <LocaleSelect className="mb-8" />

      <PopupSettings />

      <LockUpSettings />

      <ResetSettings />

      {/*<AnalyticsSettings />*/}

      {/*<LedgerLiveSettings />*/}
    </div>
  );
};

export default GeneralSettings;
