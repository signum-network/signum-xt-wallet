import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { useSharedStorage } from 'lib/temple/front';

import IconifiedSelect, { IconifiedSelectOptionRenderProps } from '../IconifiedSelect';

type TimeoutOption = {
  timeout: number;
  label: string;
  labelParam?: number | string;
};

const Minute = 60;
const Hour = 60 * Minute;
const Day = Hour * 24;

const timeoutOptions: TimeoutOption[] = [
  {
    timeout: 0,
    label: 'autoConfirmationTimeoutNever'
  },
  {
    timeout: 5 * Minute,
    label: 'autoConfirmationTimeoutMinutes',
    labelParam: 5
  },
  {
    timeout: Hour,
    label: 'autoConfirmationTimeoutOneHour'
  },
  {
    timeout: Day,
    label: 'autoConfirmationTimeoutOneDay'
  }
];

const getKey = ({ timeout }: TimeoutOption) => timeout;

const AutoConfirmationSelect = () => {
  const [confirmationTimeout, setConfirmationTimeout] =
    useSharedStorage<{ started: number; timeout: number }>('nostr_confirmation_timeout');

  const value =
    (confirmationTimeout && timeoutOptions.find(t => t.timeout === confirmationTimeout.timeout)) || timeoutOptions[0];
  const handleOnChange = ({ timeout }: TimeoutOption) => {
    setConfirmationTimeout({
      started: Math.floor(Date.now() / 1000),
      timeout
    });
  };

  const title = useMemo(
    () => (
      <>
        <h2 className="mb-1 leading-tight flex flex-col">
          <span className="text-base font-semibold text-gray-700">
            <T id="autoConfirmationTitle" />
          </span>
        </h2>
        <p className="text-xs text-gray-600 mb-3">
          <T id="autoConfirmationDescription" />
        </p>
      </>
    ),
    []
  );

  return (
    <IconifiedSelect
      Icon={Icon}
      OptionSelectedIcon={Icon}
      OptionInMenuContent={InMenuContent}
      OptionSelectedContent={SelectedContent}
      getKey={getKey}
      options={timeoutOptions}
      value={value}
      onChange={handleOnChange}
      title={title}
    />
  );
};

export default AutoConfirmationSelect;

const Icon: FC<IconifiedSelectOptionRenderProps<TimeoutOption>> = () => null;
const InMenuContent: FC<IconifiedSelectOptionRenderProps<TimeoutOption>> = ({ option: { label, labelParam } }) => {
  return (
    <div className={classNames('relative w-full text-base text-gray-700')}>
      <T id={label} substitutions={labelParam ? [labelParam] : []} />
    </div>
  );
};

const SelectedContent: FC<IconifiedSelectOptionRenderProps<TimeoutOption>> = ({ option: { label } }) => {
  return (
    <div className="flex flex-col items-start py-2">
      <div className="text-sm text-gray-700">
        <T id={label} />
      </div>
    </div>
  );
};
