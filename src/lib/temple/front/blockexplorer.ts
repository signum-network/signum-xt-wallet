// FIXME: all obsolete but signum
import { useNetwork } from 'lib/temple/front';

type BaseUrls = { account?: string; transaction: string };

export function useSignumExplorerBaseUrls(): BaseUrls {
  const network = useNetwork();
  const baseUrl = network.type === 'test' ? 'https://t-chain.signum.network' : 'https://chain.signum.network';
  return {
    account: `${baseUrl}/address`,
    transaction: `${baseUrl}/tx`
  };
}
