import { useEffect, useState } from 'react';

import { useSignum } from '../temple/front';

export const useNetworkIsReachable = () => {
  const signum = useSignum();
  const [isReachable, setIsReachable] = useState(true);
  useEffect(() => {
    signum.network
      .getBlockchainStatus()
      .then(() => setIsReachable(true))
      .catch(() => setIsReachable(false));
  }, [signum]);

  return isReachable;
};
