import { useEffect, useState } from 'react';

import { getLockUpEnabled, setLockUpEnabled } from 'lib/lockup';

export const useLockUpState = (): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [isLockupEnabled, setIsLockupEnabled] = useState(true);
  useEffect(() => {
    getLockUpEnabled().then(setIsLockupEnabled);
  }, []);

  useEffect(() => {
    setLockUpEnabled(isLockupEnabled);
  }, [isLockupEnabled]);

  return [isLockupEnabled, setIsLockupEnabled];
};
