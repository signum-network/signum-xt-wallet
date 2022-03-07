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
import useSWR from 'swr';

import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import Spinner from 'app/atoms/Spinner';
import { ReactComponent as CoffeeIcon } from 'app/icons/coffee.svg';
import { ReactComponent as CupIcon } from 'app/icons/cup.svg';
import { ReactComponent as RocketIcon } from 'app/icons/rocket.svg';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import { toLocalFixed } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import { useSignum, useSignumAssetMetadata } from 'lib/temple/front';

export type AdditionalFeeInputProps = {
  onChange: (fee: string) => void;
  factor: number;
};

type FeeType = 'minimal' | 'fast' | 'rocket' | 'custom';

type FeeOption = {
  Icon?: FunctionComponent<SVGProps<SVGSVGElement>>;
  descriptionI18nKey: string;
  type: FeeType;
  amount?: number;
};

const getFeeOptionId = (option: FeeOption) => option.type;
const FeeOptions: FeeOption[] = [
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

const FeeInput: FC<AdditionalFeeInputProps> = props => {
  const { onChange, factor } = props;
  const signum = useSignum();
  const [feeOptions, updateFeeOptions] = useState(FeeOptions);
  const [selectedType, setSelectedType] = useState<FeeType>(FeeOptions[0].type);
  const { data: baseFees, isValidating: isFetchingFees } = useSWR(
    ['getSuggestedFees', signum],
    signum.network.getSuggestedFees,
    {
      revalidateOnMount: true,
      dedupingInterval: 60_000
    }
  );

  useEffect(() => {
    if (!baseFees) return;
    const { cheap, standard, priority } = baseFees;
    feeOptions[0].amount = (cheap * factor) / 1e8;
    feeOptions[1].amount = (standard * factor) / 1e8;
    feeOptions[2].amount = (priority * factor) / 1e8;
    updateFeeOptions([...feeOptions]);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [baseFees, factor]);

  useEffect(() => {
    const selectedFee = feeOptions.find(({ type }) => selectedType === type);
    if (onChange && selectedFee) {
      onChange(`${selectedFee.amount}`);
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [selectedType, baseFees, factor]);

  if (isFetchingFees) {
    return (
      <div className={classNames('flex items-center justify-center')}>
        <Spinner theme="gray" style={{ width: '2rem' }} />
      </div>
    );
  }

  return <FeeSelector options={feeOptions} onChange={(type: any) => setSelectedType(type as FeeType)} />;
};

export default FeeInput;

interface FeeSelectorProps {
  onChange: Function;
  options: FeeOption[];
}

const FeeSelector: FC<FeeSelectorProps> = props => {
  const { onChange, options } = props;

  const [selectedPreset, setSelectedPreset] = useState<FeeOption['type']>('minimal');
  const handlePresetSelected = useCallback(
    (newType: FeeOption['type']) => {
      setSelectedPreset(newType);
      onChange && onChange(newType);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col w-full mb-2">
      <label className="flex flex-col mb-4 leading-tight" htmlFor="fee-select">
        <span className="text-base font-semibold text-gray-700">
          <T id="additionalFee" />
        </span>

        <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
          <T
            id="feeInputDescription"
            substitutions={[
              <Fragment key={0}>
                <span className="font-normal">{toLocalFixed(options[0].amount!)}</span>
              </Fragment>
            ]}
          />
        </span>
      </label>
      <div className="relative flex flex-col items-stretch">
        <CustomSelect
          activeItemId={selectedPreset}
          className="mb-4"
          getItemId={getFeeOptionId}
          id="fee-select"
          items={options}
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
  const metadata = useSignumAssetMetadata();
  return (
    <>
      <div className="flex flex-wrap items-center">
        <T id={descriptionI18nKey}>
          {message => <Name className="w-16 text-sm font-medium leading-tight text-left">{message}</Name>}
        </T>

        {amount && (
          <div className="ml-2 leading-none text-gray-600">
            <Money cryptoDecimals={5}>{amount}</Money> <span style={{ fontSize: '0.75em' }}>{metadata.symbol}</span>
          </div>
        )}
      </div>
    </>
  );
};
