import { Network } from 'lib/messaging';

// get from getConstants of the nodes
export const NetworkName = {
  Mainnet: 'Signum',
  Testnet: 'Signum-TESTNET'
};

export const NETWORKS: Network[] = [
  {
    id: 'signum-europe',
    networkName: NetworkName.Mainnet,
    name: 'Europe 1',
    description: 'Featured Node from Europe',
    type: 'main',
    rpcBaseURL: 'https://europe.signum.network',
    color: '#00FF88',
    disabled: false
  },
  {
    id: 'signum-europe-1',
    networkName: NetworkName.Mainnet,
    name: 'Europe 2',
    description: 'Another Featured Node from Europe',
    type: 'main',
    rpcBaseURL: 'https://europe1.signum.network',
    color: '#00DCA4',
    disabled: false
  },
  {
    id: 'signum-europe-2',
    networkName: NetworkName.Mainnet,
    name: 'Europe 3',
    description: 'Another Featured Node from Europe',
    type: 'main',
    rpcBaseURL: 'https://europe2.signum.network',
    color: '#00C88A',
    disabled: false
  },
  {
    id: 'signum-uk',
    networkName: NetworkName.Mainnet,
    name: 'United Kingdom',
    description: 'Featured Node from the UK',
    type: 'main',
    rpcBaseURL: 'https://uk.signum.network',
    color: '#00AD89',
    disabled: false
  },
  {
    id: 'signum-us-east',
    networkName: NetworkName.Mainnet,
    name: 'US East',
    description: 'Featured Node from the US',
    type: 'main',
    rpcBaseURL: 'https://us-east.signum.network',
    color: '#00A0A0',
    disabled: false
  },
  {
    id: 'signum-canada',
    networkName: NetworkName.Mainnet,
    name: 'Canada',
    description: 'Featured Node from Canada',
    type: 'main',
    rpcBaseURL: 'https://canada.signum.network',
    color: '#009186',
    disabled: false
  },
  {
    id: 'signum-latam',
    networkName: NetworkName.Mainnet,
    name: 'Latin America US',
    description: 'Featured Node from Latin America',
    type: 'main',
    rpcBaseURL: 'https://latam.signum.network',
    color: '#00B7AE',
    disabled: false
  },
  {
    id: 'signum-brazil',
    networkName: NetworkName.Mainnet,
    name: 'Latin America BR',
    description: 'Featured Node from South America',
    type: 'main',
    rpcBaseURL: 'https://brazil.signum.network',
    color: '#0090A2',
    disabled: false
  },
  {
    id: 'signum-australia',
    networkName: NetworkName.Mainnet,
    name: 'Australia',
    description: 'Featured Node from Australia',
    type: 'main',
    rpcBaseURL: 'https://australia.signum.network',
    color: '#001b69',
    disabled: false
  },
  {
    id: 'signum-singapore',
    networkName: NetworkName.Mainnet,
    name: 'Asia SG',
    description: 'Featured Node from Singapore',
    type: 'main',
    rpcBaseURL: 'https://singapore.signum.network',
    color: '#001b69',
    disabled: false
  },
  {
    id: 'signum-mainnet-local',
    networkName: NetworkName.Mainnet,
    name: 'Local Mainnet',
    description: 'For those who run a local main net node on standard port 8125',
    type: 'main',
    rpcBaseURL: 'http://localhost:8125',
    color: '#2F4858',
    disabled: false
  },
  {
    id: 'signum-testnet-europe',
    networkName: NetworkName.Testnet,
    name: 'Europe Testnet ',
    description: 'Public Testnet Node Europe',
    type: 'test',
    rpcBaseURL: 'https://europe3.testnet.signum.network',
    color: '#FFBB00',
    disabled: false
  },
  {
    id: 'signum-testnet-local',
    networkName: NetworkName.Testnet,
    name: 'Local Testnet',
    description: 'For those hackers who run a local test net node on standard port 6876',
    type: 'test',
    rpcBaseURL: 'http://localhost:6876',
    color: '#CD9000',
    disabled: false
  }
];
