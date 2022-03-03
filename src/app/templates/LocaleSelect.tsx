import React, { useMemo, useCallback, FC } from 'react';

import classNames from 'clsx';
import browser from 'webextension-polyfill';

import Flag from 'app/atoms/Flag';
import { AnalyticsEventCategory, AnalyticsEventEnum, useAnalytics } from 'lib/analytics';
import { getCurrentLocale, T, updateLocale } from 'lib/i18n/react';

import IconifiedSelect, { IconifiedSelectOptionRenderProps } from './IconifiedSelect';

type LocaleSelectProps = {
  className?: string;
};

type LocaleOption = {
  code: string;
  disabled: boolean;
  flagName: string;
  label: string;
};

const localeOptions: LocaleOption[] = [
  {
    code: 'en',
    flagName: 'us',
    label: 'English',
    disabled: false
  },
  {
    code: 'de',
    flagName: 'de',
    label: 'German (Deutsch)',
    disabled: false
  },
  {
    code: 'es',
    flagName: 'es',
    label: 'Spanish (Español)',
    disabled: false
  },
  {
    code: 'pt_BR',
    flagName: 'br',
    label: 'Portuguese (Português)',
    disabled: false
  },
  {
    code: 'ru',
    flagName: 'ru',
    label: 'Russian (Русский)',
    disabled: false
  },
  {
    code: 'th',
    flagName: 'th',
    label: 'Thai (ไทย)',
    disabled: false
  },
  {
    code: 'uk',
    flagName: 'ua',
    label: 'Ukrainian (український)',
    disabled: false
  },
];

const localeIsDisabled = ({ disabled }: LocaleOption) => disabled;

const getLocaleCode = ({ code }: LocaleOption) => code;

const LocaleSelect: FC<LocaleSelectProps> = ({ className }) => {
  const selectedLocale = getCurrentLocale();
  const { trackEvent } = useAnalytics();
  const value = useMemo(
    () => localeOptions.find(({ code }) => code === selectedLocale) || localeOptions[0],
    [selectedLocale]
  );

  const title = useMemo(
    () => (
      <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
        <span className="text-base font-semibold text-gray-700">
          <T id="languageAndCountry" />
        </span>
      </h2>
    ),
    []
  );

  const handleLocaleChange = useCallback(
    ({ code }: LocaleOption) => {
      trackEvent(AnalyticsEventEnum.LanguageChanged, AnalyticsEventCategory.ButtonPress, { code });
      updateLocale(code);
    },
    [trackEvent]
  );

  return (
    <IconifiedSelect
      Icon={LocaleIcon}
      OptionSelectedIcon={LocaleIcon}
      OptionInMenuContent={LocaleInMenuContent}
      OptionSelectedContent={LocaleSelectContent}
      getKey={getLocaleCode}
      isDisabled={localeIsDisabled}
      options={localeOptions}
      value={value}
      onChange={handleLocaleChange}
      title={title}
      className={className}
    />
  );
};

export default LocaleSelect;

const LocaleIcon: FC<IconifiedSelectOptionRenderProps<LocaleOption>> = ({ option: { flagName, code } }) => (
  <Flag alt={code} className="ml-2 mr-3" src={browser.runtime.getURL(`/misc/country-flags/${flagName}.svg`)} />
);

const LocaleInMenuContent: FC<IconifiedSelectOptionRenderProps<LocaleOption>> = ({ option: { disabled, label } }) => {
  return (
    <div className={classNames('relative w-full text-lg text-gray-700')}>
      {label}

      {disabled && (
        <div className={classNames('absolute top-0 bottom-0 right-0', 'flex items-center')}>
          <div
            className={classNames(
              'mr-2 px-1',
              'bg-orange-500 rounded-sm shadow-md',
              'text-white',
              'text-xs font-semibold uppercase'
            )}
          >
            <T id="soon" />
          </div>
        </div>
      )}
    </div>
  );
};

const LocaleSelectContent: FC<IconifiedSelectOptionRenderProps<LocaleOption>> = ({ option }) => {
  return (
    <div className="flex flex-col items-start py-2">
      <span className="text-xl text-gray-700">{option.label}</span>
    </div>
  );
};
