import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';

import FormCheckbox from 'app/atoms/FormCheckbox';
import FormField from 'app/atoms/FormField';
import { t } from 'lib/i18n/react';

interface InternalFormData {
  message: string;
  isBinary: boolean;
  isVisible: boolean;
  isEncrypted: boolean;
}

export interface MessageFormData {
  message: string;
  isBinary: boolean;
  isValid: boolean;
  isEncrypted: boolean;
}

interface FormProps {
  onChange: (args: MessageFormData) => void;
  showEncrypted: boolean;
  mode: 'transfer' | 'p2pMessage';
}

const HEX_PATTERN = /^(0x)?[0-9a-fA-F]+$/;
const MAX_CHARS = 1000;

export const MessageForm = React.forwardRef(({ onChange, showEncrypted, mode }: FormProps, ref) => {
  const isP2PMode = mode === 'p2pMessage';
  const [isHexadecimalMessage, setIsHexadecimalMessage] = useState(false);
  const { register, triggerValidation, errors, formState, watch, reset, setValue } = useForm<InternalFormData>({
    mode: 'onChange',
    defaultValues: {
      message: '',
      isBinary: false,
      isVisible: isP2PMode,
      isEncrypted: false
    }
  });

  useImperativeHandle(ref, () => ({
    reset: () =>
      reset({
        message: '',
        isBinary: false,
        isVisible: isP2PMode,
        isEncrypted: false
      })
  }));

  const isBinary = watch('isBinary');
  const isEncrypted = watch('isEncrypted');
  const message = watch('message');
  const isVisible = isP2PMode ? true : watch('isVisible');
  const label = useMemo(() => t(isBinary ? 'hexCodeAttachment' : 'textAttachment'), [isBinary]);
  const placeholder = useMemo(() => t(isBinary ? 'enterHexCode' : 'enterText'), [isBinary]);
  const dataRegistry = useMemo(
    () =>
      register({
        maxLength: {
          value: MAX_CHARS,
          message: t('mustBeLessThanChars', `${MAX_CHARS}`)
        },
        pattern: isBinary
          ? {
              value: HEX_PATTERN,
              message: t('mustBeHexCode')
            }
          : undefined
      }),
    [isBinary, register]
  );

  useEffect(() => {
    let prunedMessage = message;
    if (isHexadecimalMessage && isBinary && message.startsWith('0x')) {
      prunedMessage = message.replace('0x', '');
    }

    onChange({
      message: prunedMessage,
      isBinary: isHexadecimalMessage && isBinary,
      isValid: formState.isValid,
      isEncrypted: isEncrypted && showEncrypted
    });
  }, [isEncrypted, isBinary, message, formState.isValid, onChange, showEncrypted]);

  useEffect(() => {
    triggerValidation(['message']);
  }, [isBinary, triggerValidation]);

  useEffect(() => {
    if (!isHexadecimalMessage) {
      // hide until it pops up first time
      setIsHexadecimalMessage(HEX_PATTERN.test(message));
      setValue('isBinary', true);
    }
  }, [message, isHexadecimalMessage, setValue]);

  return (
    <div>
      {!isP2PMode && (
        <FormCheckbox
          ref={register()}
          name="isVisible"
          label={label}
          labelDescription={t('attachmentDescription')}
          containerClassName="mt-4"
        />
      )}

      {isVisible && (
        <>
          <FormField
            ref={dataRegistry}
            id="create-ledger-name"
            type="text"
            name="message"
            placeholder={placeholder}
            errorCaption={errors.message?.message}
            containerClassName="mt-4"
            textarea
            rows={isP2PMode ? 10 : 3}
            maxLength={MAX_CHARS}
          />
          {showEncrypted && (
            <FormCheckbox
              ref={register()}
              name="isEncrypted"
              label={t('attachmentIsEncrypted')}
              labelDescription={t('attachmentIsEncryptedDescription')}
              containerClassName="mt-4"
            />
          )}
          {isHexadecimalMessage && (
            <FormCheckbox
              ref={register()}
              name="isBinary"
              label={t('attachmentIsBinary')}
              labelDescription={t('attachmentIsBinaryDescription')}
              containerClassName="mt-4"
              /* default value */
              checked={true}
            />
          )}
        </>
      )}
    </div>
  );
});
