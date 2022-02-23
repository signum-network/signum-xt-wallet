import React, { FC, Suspense, useMemo } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner';
import ErrorBoundary from 'app/ErrorBoundary';
import ContentContainer from 'app/layouts/ContentContainer';
import Unlock from 'app/pages/Unlock';
import { t } from 'lib/i18n/react';
import { useTempleClient } from 'lib/temple/front';

import ConfirmDAppForm from './pages/Confirm/ConfirmDAppForm';

const ConfirmPage: FC = () => {
  const { ready } = useTempleClient();

  return useMemo(
    () =>
      ready ? (
        <ContentContainer
          padding={false}
          className={classNames('min-h-screen', 'flex flex-col items-center justify-center')}
        >
          <ErrorBoundary whileMessage={t('fetchingConfirmationDetails')}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-screen">
                  <div>
                    <Spinner theme="primary" className="w-20" />
                  </div>
                </div>
              }
            >
              <ConfirmDAppForm />
            </Suspense>
          </ErrorBoundary>
        </ContentContainer>
      ) : (
        <Unlock canImportNew={false} />
      ),
    [ready]
  );
};

export default ConfirmPage;
