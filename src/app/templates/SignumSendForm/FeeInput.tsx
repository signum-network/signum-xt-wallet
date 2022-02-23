import React, {
  ComponentType,
  FC,
  ForwardRefExoticComponent,
  Fragment,
  FunctionComponent,
  MutableRefObject,
  SVGProps,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { FeeQuantPlanck } from '@signumjs/util';
import classNames from 'clsx';
import { Controller, ControllerProps, EventFunction, FieldError } from 'react-hook-form';

import AssetField from 'app/atoms/AssetField';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import Spinner from 'app/atoms/Spinner';
import { ReactComponent as CoffeeIcon } from 'app/icons/coffee.svg';
import { ReactComponent as CupIcon } from 'app/icons/cup.svg';
import { ReactComponent as RocketIcon } from 'app/icons/rocket.svg';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import { toLocalFixed } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import { SIGNA_METADATA, useSignum } from 'lib/temple/front';

type AssetFieldProps = typeof AssetField extends ForwardRefExoticComponent<infer T> ? T : never;

export type AdditionalFeeInputProps = Pick<ControllerProps<ComponentType>, 'name' | 'control' | 'onChange'> & {
  assetSymbol: string;
  error?: FieldError;
  id: string;
};

type FeeOption = {
  Icon?: FunctionComponent<SVGProps<SVGSVGElement>>;
  descriptionI18nKey: string;
  type: 'minimal' | 'fast' | 'rocket' | 'custom';
  amount?: number;
};

const feeOptions: FeeOption[] = [
  {
    Icon: CoffeeIcon,
    descriptionI18nKey: 'minimalFeeDescription',
    type: 'minimal',
    amount: FeeQuantPlanck / 1e8
  },
  {
    Icon: ({ className, ...rest }) => <CupIcon className={classNames('transform scale-95', className)} {...rest} />,
    descriptionI18nKey: 'fastFeeDescription',
    type: 'fast',
    amount: undefined
  },
  {
    Icon: RocketIcon,
    descriptionI18nKey: 'rocketFeeDescription',
    type: 'rocket',
    amount: undefined
  }
];

const getFeeOptionId = (option: FeeOption) => option.type;

const FeeInput: FC<AdditionalFeeInputProps> = props => {
  const { assetSymbol, control, id, name, onChange } = props;
  const [isFetchingFees, setIsFetchingFees] = useState<boolean>(true);
  // const { trackEvent } = useAnalytics();

  const customFeeInputRef = useRef<HTMLInputElement>(null);
  const signum = useSignum();
  const focusCustomFeeInput = useCallback(() => {
    customFeeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!signum) return;

    async function fetchFees() {
      setIsFetchingFees(true);
      const { cheap, standard, priority } = await signum.network.getSuggestedFees();
      feeOptions[0].amount = cheap / 1e8;
      feeOptions[1].amount = standard / 1e8;
      feeOptions[2].amount = priority / 1e8;
      setIsFetchingFees(false);
    }

    fetchFees();
  }, [signum]);

  const handleChange: EventFunction = event => {
    return onChange !== undefined && onChange(event);
  };

  if (isFetchingFees) {
    return (
      <div className={classNames('flex items-center justify-center')}>
        <Spinner theme="gray" style={{ width: '2rem' }} />
      </div>
    );
  }

  return (
    <Controller
      name={name}
      as={AdditionalFeeInputContent}
      control={control}
      customFeeInputRef={customFeeInputRef}
      onChange={handleChange}
      id={id}
      assetSymbol={assetSymbol}
      onFocus={focusCustomFeeInput}
      label={t('additionalFee')}
      labelDescription={
        <T
          id="feeInputDescription"
          substitutions={[
            <Fragment key={0}>
              <span className="font-normal">{toLocalFixed(FeeQuantPlanck / 1e8)}</span>
            </Fragment>
          ]}
        />
      }
      placeholder="0"
    />
  );
};

export default FeeInput;

type AdditionalFeeInputContentProps = AssetFieldProps & {
  customFeeInputRef: MutableRefObject<HTMLInputElement | null>;
};

const AdditionalFeeInputContent: FC<AdditionalFeeInputContentProps> = props => {
  const { onChange, id, label, labelDescription, value } = props;

  const [selectedPreset, setSelectedPreset] = useState<FeeOption['type']>(
    feeOptions.find(({ amount }) => amount === value)?.type || 'minimal'
  );
  const handlePresetSelected = useCallback(
    (newType: FeeOption['type']) => {
      setSelectedPreset(newType);
      const option = feeOptions.find(({ type }) => type === newType)!;
      if (option.amount) {
        onChange?.(`${option.amount}`);
      }
    },
    [onChange]
  );

  return (
    <div className="flex flex-col w-full mb-2">
      {label && (
        <label className="flex flex-col mb-4 leading-tight" htmlFor={`${id}-select`}>
          <span className="text-base font-semibold text-gray-700">{label}</span>

          {labelDescription && (
            <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
              {labelDescription}
            </span>
          )}
        </label>
      )}

      <div className="relative flex flex-col items-stretch">
        <CustomSelect
          activeItemId={selectedPreset}
          className="mb-4"
          getItemId={getFeeOptionId}
          id={`${id}-select`}
          items={feeOptions}
          onSelect={handlePresetSelected}
          padding="0.2rem 0.375rem 0.2rem 0.375rem"
          OptionIcon={FeeOptionIcon}
          OptionContent={FeeOptionContent}
        />
      </div>
    </div>
  );
};

const FeeOptionIcon: FC<OptionRenderProps<FeeOption>> = ({ item: { Icon } }) => {
  if (Icon) {
    return <Icon className="flex-none inline-block stroke-current opacity-90" style={{ width: 24, height: 24 }} />;
  }

  return <div style={{ width: 24, height: 24 }} />;
};

const FeeOptionContent: FC<OptionRenderProps<FeeOption>> = ({ item: { descriptionI18nKey, amount } }) => {
  return (
    <>
      <div className="flex flex-wrap items-center">
        <T id={descriptionI18nKey}>
          {message => <Name className="w-16 text-sm font-medium leading-tight text-left">{message}</Name>}
        </T>

        {amount && (
          <div className="ml-2 leading-none text-gray-600">
            <Money cryptoDecimals={5}>{amount}</Money>{' '}
            <span style={{ fontSize: '0.75em' }}>{SIGNA_METADATA.symbol}</span>
          </div>
        )}
      </div>
    </>
  );
};
