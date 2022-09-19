import React, { FC, ReactNode, useCallback, useEffect, useRef } from 'react';

import classNames from 'clsx';
import { FormContextValues, useForm } from 'react-hook-form';
import { cache as swrCache } from 'swr';
import { useDebouncedCallback } from 'use-debounce';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import NoSpaceField from 'app/atoms/NoSpaceField';
import Spinner from 'app/atoms/Spinner';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import PageLayout from 'app/layouts/PageLayout';
import AssetIcon from 'app/templates/AssetIcon';
import { T, t } from 'lib/i18n/react';
import {
  useNetwork,
  NotMatchingStandardError,
  useTokensMetadata,
  NotFoundTokenMetadata,
  useAccount,
  getBalanceSWRKey,
  IncorrectTokenIdError,
  AssetMetadata,
  useSignum
} from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';
import useSafeState from 'lib/ui/useSafeState';
import { navigate } from 'lib/woozie';

const AddAsset: FC = () => (
  <PageLayout
    pageTitle={
      <>
        <AddIcon className="w-auto h-4 mr-1 stroke-current" />
        <T id="addAsset" />
      </>
    }
  >
    <Form />
  </PageLayout>
);

export default AddAsset;

type FormData = {
  tokenId: string;
  id?: number;
  symbol: string;
  name: string;
  decimals: number;
  thumbnailUri: string;
};

type ComponentState = {
  processing: boolean;
  bottomSectionVisible: boolean;
  tokenValidationError: ReactNode;
  tokenDataError: ReactNode;
};

const INITIAL_STATE: ComponentState = {
  processing: false,
  bottomSectionVisible: false,
  tokenValidationError: null,
  tokenDataError: null
};

class ContractNotFoundError extends Error {}

const Form: FC = () => {
  const network = useNetwork();
  const { publicKey: accountPkh } = useAccount();
  const { fetchMetadata, setTokensBaseMetadata } = useTokensMetadata();

  const { register, handleSubmit, errors, formState, watch, setValue, triggerValidation } = useForm<FormData>({
    mode: 'onChange'
  });

  const tokenId = watch('tokenId');
  const formValid = validateTokenId(tokenId) === true;

  function validateTokenId(id: string) {
    if (!/^\d{18,21}$/.test(id)) {
      return t('invalidAddress');
    }
    return true;
  }

  const [{ processing, bottomSectionVisible, tokenValidationError, tokenDataError }, setState] =
    useSafeState(INITIAL_STATE);
  const [submitError, setSubmitError] = useSafeState<ReactNode>(null);

  const attemptRef = useRef(0);
  const metadataRef = useRef<{ base: AssetMetadata }>();

  const loadMetadataPure = useCallback(async () => {
    if (!formValid) return;
    const attempt = ++attemptRef.current;
    setState({
      ...INITIAL_STATE,
      processing: true
    });

    let stateToSet: Partial<ComponentState>;

    try {
      const metadata = await fetchMetadata(tokenId);
      metadataRef.current = metadata;
      const { base } = metadata;
      // setValue([
      //   { symbol: base.symbol },
      //   { name: base.name },
      //   { decimals: base.decimals },
      //   { thumbnailUri: base.thumbnailUri }
      // ]);
      //

      setValue('name', base.name)
      stateToSet = {
        bottomSectionVisible: true
      };
    } catch (err: any) {
      await withErrorHumanDelay(err, () => {
        stateToSet = errorHandler(err, tokenId, setState);
      });
    }

    if (attempt === attemptRef.current) {
      setState(currentState => ({
        ...currentState,
        ...stateToSet,
        processing: false
      }));
    }
  }, [setValue, setState, fetchMetadata, tokenId, formValid]);

  const loadMetadata = useDebouncedCallback(loadMetadataPure, 500);

  const loadMetadataRef = useRef(loadMetadata);
  useEffect(() => {
    loadMetadataRef.current = loadMetadata;
  }, [loadMetadata]);

  useEffect(() => {
    if (formValid) {
      loadMetadataRef.current();
    } else {
      setState(INITIAL_STATE);
      attemptRef.current++;
    }
  }, [setState, formValid]);

  const cleanContractAddress = useCallback(() => {
    setValue('tokenId', '');
    triggerValidation('tokenId');
  }, [setValue, triggerValidation]);

  const onSubmit = useCallback(
    async ({ name }: FormData) => {
      if (!metadataRef.current?.base) return;
      if (formState.isSubmitting) return;
      setSubmitError(null);
      try {
        const baseMetadata = {
          ...metadataRef.current.base,
          name
        };

        await setTokensBaseMetadata({ [tokenId]: baseMetadata });
        const { networkName } = network;
        await Repo.accountTokens.put(
          {
            type: Repo.ITokenType.Fungible,
            network: networkName,
            account: accountPkh,
            tokenId,
            status: Repo.ITokenStatus.Enabled,
            addedAt: Date.now()
          },
          Repo.toAccountTokenKey(networkName, accountPkh, tokenId)
        );

        swrCache.delete(getBalanceSWRKey(network, tokenId, accountPkh));

        navigate({
          pathname: `/explore/${tokenId}`,
          search: 'after_token_added=true'
        });
      } catch (err: any) {
        console.error(err);

        // Human delay
        await new Promise(r => setTimeout(r, 300));
        setSubmitError(err.message);
      }
    },
    [formState.isSubmitting, setSubmitError, setTokensBaseMetadata, tokenId, accountPkh, network]
  );

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      <NoSpaceField
        ref={register({
          required: t('required'),
          validate: validateTokenId
        })}
        name="tokenId"
        id="addtoken-tokenid"
        cleanable={Boolean(tokenId)}
        onClean={cleanContractAddress}
        label={t('address')}
        labelDescription={t('addressOfDeployedTokenContract')}
        placeholder={t('tokenContractPlaceholder')}
        errorCaption={errors.tokenId?.message}
        containerClassName="mb-6"
      />

      {tokenValidationError && (
        <Alert type="error" title={t('error')} autoFocus description={tokenValidationError} className="mb-8" />
      )}

      {tokenDataError && (
        <Alert type="warn" title={t('failedToParseMetadata')} autoFocus description={tokenDataError} className="mb-8" />
      )}

      <div
        className={classNames('w-full', {
          hidden: !bottomSectionVisible || processing
        })}
      >
        {metadataRef.current && (
          <BottomSection
            metaData={metadataRef.current.base}
            register={register}
            errors={errors}
            formState={formState}
            submitError={submitError}
          />
        )}
      </div>

      {processing && (
        <div className="my-8 w-full flex items-center justify-center pb-4">
          <div>
            <Spinner theme="gray" className="w-20" />
          </div>
        </div>
      )}
    </form>
  );
};

type BottomSectionProps = Pick<FormContextValues, 'register' | 'errors' | 'formState'> & {
  submitError?: ReactNode;
  metaData: AssetMetadata;
};

const BottomSection: FC<BottomSectionProps> = props => {
  const { metaData, register, errors, formState, submitError } = props;
  const { id, description } = metaData;
  return (
    <div>
      <div className="text-center mb-4">
        <AssetIcon tokenId={id} size={48} />
        <div>
          <small>{description}</small>
        </div>
      </div>

      <FormField
        ref={register({
          required: t('required'),
          validate: (val: string) => {
            if (!val || val.length < 3 || val.length > 50) {
              return t('tokenNamePatternDescription');
            }
            return true;
          }
        })}
        name="name"
        id="addtoken-name"
        label={t('name')}
        labelDescription={t('tokenNameInputDescription')}
        placeholder={t('tokenNameInputPlaceholder')}
        errorCaption={errors.name?.message}
        containerClassName="mb-4"
      />
      {submitError && <Alert type="error" title={t('error')} autoFocus description={submitError} className="mb-6" />}

      <T id="addToken">{message => <FormSubmitButton loading={formState.isSubmitting}>{message}</FormSubmitButton>}</T>
    </div>
  );
};

const errorHandler = (err: any, contractAddress: string, setValue: any) => {
  if (err instanceof ContractNotFoundError) {
    return {
      tokenValidationError: t('referredByTokenContractNotFound', contractAddress)
    };
  } else if (err instanceof NotMatchingStandardError) {
    const errorMessage = err instanceof IncorrectTokenIdError ? `: ${err.message}` : '';
    return {
      tokenValidationError: `${t('tokenDoesNotMatchStandard', 'FA')}${errorMessage}`
    };
  } else {
    const errorMessage = t(
      err instanceof NotFoundTokenMetadata ? 'failedToParseMetadata' : 'unknownParseErrorOccurred'
    );
    setValue([{ symbol: '' }, { name: '' }, { decimals: 0 }]);
    return {
      bottomSectionVisible: true,
      tokenDataError: errorMessage
    };
  }
};
