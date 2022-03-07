import React, { useEffect, useImperativeHandle, useMemo } from 'react';

import { useForm } from 'react-hook-form';

import FormCheckbox from 'app/atoms/FormCheckbox';
import FormField from 'app/atoms/FormField';
import { t } from 'lib/i18n/react';

interface InternalFormData {
  message: string;
  isBinary: boolean;
  isVisible: boolean;
}

export interface MessageFormData {
  message: string;
  isBinary: boolean;
  isValid: boolean;
}

interface FormProps {
  onChange: (args: MessageFormData) => void;
}

const HEX_PATTERN = /^[0-9a-fA-F]+$/;
const MAX_CHARS = 1000;

export const MessageForm = React.forwardRef(({ onChange }: FormProps, ref) => {
  const { register, triggerValidation, errors, formState, watch, reset } = useForm<InternalFormData>({
    mode: 'onChange',
    defaultValues: {
      message: '',
      isBinary: false,
      isVisible: false
    }
  });

  useImperativeHandle(ref, () => ({
    reset: () =>
      reset({
        message: '',
        isBinary: false,
        isVisible: false
      })
  }));

  const isBinary = watch('isBinary');
  const message = watch('message');
  const isVisible = watch('isVisible');
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
    onChange({
      message,
      isBinary,
      isValid: formState.isValid
    });
  }, [isBinary, message, formState.isValid, onChange]);

  useEffect(() => {
    triggerValidation(['message']);
  }, [isBinary, triggerValidation]);

  return (
    <div>
      <FormCheckbox
        ref={register()}
        name="isVisible"
        label={label}
        labelDescription={t('attachmentDescription')}
        containerClassName="mt-4"
      />

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
            maxLength={MAX_CHARS}
          />

          <FormCheckbox
            ref={register()}
            name="isBinary"
            label={t('attachmentIsBinary')}
            labelDescription={t('attachmentIsBinaryDescription')}
            containerClassName="mt-4"
          />
        </>
      )}
    </div>
  );
});
