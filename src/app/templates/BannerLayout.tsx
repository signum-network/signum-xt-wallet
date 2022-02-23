import React, { FC, ReactNode } from 'react';

import classNames from 'clsx';

type BannerLayoutProps = {
  name: ReactNode;
};

const BannerLayout: FC<BannerLayoutProps> = ({ name, children }) => (
  <div className={classNames('w-full mx-auto', 'pt-1', 'flex flex-col items-center max-w-sm')}>
    <div className={classNames('relative', 'w-full', 'border rounded-md', 'p-2', 'flex items-center')}>
      <div className={classNames('absolute top-0 left-0 right-0', 'flex justify-center')}>
        <div
          className={classNames(
            '-mt-3 py-1 px-2',
            'bg-white rounded-full',
            'text-sm font-light leading-none text-center',
            'text-gray-500'
          )}
        >
          {name}
        </div>
      </div>

      {children}
    </div>
  </div>
);

export default BannerLayout;
