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
  useTokensMetadata,
  useAccount,
  getBalanceSWRKey,
  AssetMetadata,
  FEATURED_TOKEN_IDS
} from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';
import useSafeState from 'lib/ui/useSafeState';
import { navigate, useLocation } from 'lib/woozie';

const AddAsset: FC = () => {
  const { search } = useLocation();
  const usp = new URLSearchParams(search);
  const tokenId = usp.get('token-id') || undefined;

  return (
    <PageLayout
      pageTitle={
        <>
          <AddIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="addAsset" />
        </>
      }
    >
      <AddAssetForm tokenId={tokenId} />
    </PageLayout>
  );
};

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
  tokenNotFoundError: boolean;
  tokenAlreadyAdded: boolean;
};

const INITIAL_STATE: ComponentState = {
  processing: false,
  bottomSectionVisible: false,
  tokenNotFoundError: false,
  tokenAlreadyAdded: false
};

function validateTokenId(id: string) {
  if (!/^\d{18,21}$/.test(id)) {
    return t('invalidAddress');
  }
  return true;
}

class TokenAlreadyAdded extends Error {}

interface FormProps {
  tokenId?: string;
}

const AddAssetForm: FC<FormProps> = ({ tokenId: token }) => {
  const network = useNetwork();
  const { publicKey: accountPkh } = useAccount();
  const { fetchMetadata, setTokensBaseMetadata } = useTokensMetadata();
  const [{ processing, bottomSectionVisible, tokenNotFoundError, tokenAlreadyAdded }, setState] =
    useSafeState(INITIAL_STATE);
  const [submitError, setSubmitError] = useSafeState<ReactNode>(null);
  const attemptRef = useRef(0);
  const [metadata, setMetadata] = useSafeState<AssetMetadata | null>(null);

  const { register, handleSubmit, errors, formState, watch, setValue, triggerValidation } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      tokenId: token,
      name: ''
    }
  });

  const tokenId = watch('tokenId');
  const formValid = validateTokenId(tokenId) === true;

  const loadMetadataPure = useCallback(async () => {
    if (!formValid) return;
    const attempt = ++attemptRef.current;
    setState({
      ...INITIAL_STATE,
      processing: true
    });
    let stateToSet: Partial<ComponentState>;
    try {
      if (FEATURED_TOKEN_IDS.includes(tokenId)) {
        throw new TokenAlreadyAdded();
      }

      const { networkName } = network;
      const hasToken = await Repo.accountTokens.get(Repo.toAccountTokenKey(networkName, accountPkh, tokenId));
      if (hasToken) {
        throw new TokenAlreadyAdded();
      }

      const { base } = await fetchMetadata(tokenId);

      setValue('name', base.name);
      setMetadata(base);
      stateToSet = {
        bottomSectionVisible: true,
        tokenNotFoundError: false,
        tokenAlreadyAdded: false
      };
    } catch (err: any) {
      await withErrorHumanDelay(err, () => {
        setMetadata(null);
        if (err instanceof TokenAlreadyAdded) {
          stateToSet = {
            bottomSectionVisible: false,
            tokenNotFoundError: false,
            tokenAlreadyAdded: true
          };
        } else {
          stateToSet = {
            bottomSectionVisible: false,
            tokenNotFoundError: true,
            tokenAlreadyAdded: false
          };
        }
      });
    }

    if (attempt === attemptRef.current) {
      setState(currentState => ({
        ...currentState,
        ...stateToSet,
        processing: false
      }));
    }
  }, [formValid, setState, tokenId, network, accountPkh, fetchMetadata, setValue, setMetadata]);

  const loadMetadata = useDebouncedCallback(loadMetadataPure, 500);

  useEffect(() => {
    if (formValid) {
      loadMetadata();
    } else {
      setState(INITIAL_STATE);
      attemptRef.current++;
    }
  }, [setState, formValid, loadMetadata, tokenId]);

  const clearTokenIdField = useCallback(() => {
    setValue('tokenId', '');
    triggerValidation('tokenId');
  }, [setValue, triggerValidation]);

  const onSubmit = useCallback(
    async ({ name }: FormData) => {
      if (!metadata) return;
      if (formState.isSubmitting) return;
      setSubmitError(null);
      try {
        await setTokensBaseMetadata({
          [tokenId]: {
            ...metadata,
            name
          }
        });
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
        await withErrorHumanDelay(err, () => {
          setSubmitError(err.message);
        });
      }
    },
    [metadata, formState.isSubmitting, setSubmitError, setTokensBaseMetadata, tokenId, network, accountPkh]
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
        onClean={clearTokenIdField}
        label={t('tokenId')}
        labelDescription={t('tokenIdLabel')}
        placeholder={t('tokenIdPlaceholder')}
        errorCaption={errors.tokenId?.message}
        containerClassName="mb-6"
      />

      {tokenNotFoundError && (
        <Alert
          type="warn"
          title={t('tokenNotFoundError')}
          autoFocus
          className="mb-8"
          description={t('tokenNotFoundDescription', tokenId)}
        />
      )}

      {tokenAlreadyAdded && (
        <Alert
          type="warn"
          title={t('tokenAlreadyAddedError')}
          autoFocus
          className="mb-8"
          description={t('tokenAlreadyAddedDescription', tokenId)}
        />
      )}

      <div
        className={classNames('w-full', {
          hidden: !bottomSectionVisible || processing
        })}
      >
        <BottomSection
          metaData={metadata}
          register={register}
          errors={errors}
          formState={formState}
          submitError={submitError}
        />
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
  metaData?: AssetMetadata | null;
};

const BottomSection: FC<BottomSectionProps> = props => {
  const { metaData, register, errors, formState, submitError } = props;

  return (
    <div>
      <div className="flex flex-col justify-center mb-4">
        <div className="text-center mx-auto">{metaData && <AssetIcon metadata={metaData} size={48} />}</div>
        <div className="text-gray-600">
          <small>{metaData?.description}</small>
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
