import { useNetwork } from 'lib/temple/front';

export function useSignumExplorerBaseUrls() {
  const network = useNetwork();
  const baseUrl = network.type === 'test' ? 'https://t-chain.signum.network' : 'https://chain.signum.network';
  return {
    account: `${baseUrl}/address`,
    transaction: `${baseUrl}/tx`,
    token: `${baseUrl}/asset`
  };
}
