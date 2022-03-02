import React, { FC, useEffect, useLayoutEffect, useState } from 'react';

import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { initializeI18n } from 'lib/i18n';

const BootAnimation: FC = ({ children }) => {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    initializeI18n(() => {
      setBooted(true);
    });
  }, []);

  return (
    <CSSTransition
      in={booted}
      timeout={200}
      classNames={{
        enter: 'opacity-0',
        enterActive: classNames('opacity-100', 'transition ease-out duration-200'),
        exit: classNames('opacity-0', 'transition ease-in duration-200')
      }}
      unmountOnExit
    >
      {children}
    </CSSTransition>
  );
};

export default BootAnimation;
