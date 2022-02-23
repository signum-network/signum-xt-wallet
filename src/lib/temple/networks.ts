import { TempleNetwork } from 'lib/temple/types';

export const NETWORKS: TempleNetwork[] = [
  {
    id: 'signum-europe',
    name: 'Europe 1',
    description: 'Featured Node from Europe',
    type: 'main',
    rpcBaseURL: 'https://europe.signum.network',
    color: '#00FF88',
    disabled: false
  },
  {
    id: 'signum-europe-1',
    name: 'Europe 2',
    description: 'Another Featured Node from Europe',
    type: 'main',
    rpcBaseURL: 'https://europe1.signum.network',
    color: '#00DCA4',
    disabled: false
  },
  {
    id: 'signum-europe-2',
    name: 'Europe 3',
    description: 'Another Featured Node from Europe',
    type: 'main',
    rpcBaseURL: 'https://europe2.signum.network',
    color: '#00C88A',
    disabled: false
  },
  {
    id: 'signum-uk',
    name: 'United Kingdom',
    description: 'Featured Node from the UK',
    type: 'main',
    rpcBaseURL: 'https://uk.signum.network',
    color: '#00AD89',
    disabled: false
  },
  {
    id: 'signum-us-east',
    name: 'US East',
    description: 'Featured Node from the US',
    type: 'main',
    rpcBaseURL: 'https://us-east.signum.network',
    color: '#00A0A0',
    disabled: false
  },
  {
    id: 'signum-canada',
    name: 'Canada',
    description: 'Featured Node from Canada',
    type: 'main',
    rpcBaseURL: 'https://canada.signum.network',
    color: '#009186',
    disabled: false
  },
  {
    id: 'signum-latam',
    name: 'Latin America US',
    description: 'Featured Node from Latin America',
    type: 'main',
    rpcBaseURL: 'https://latam.signum.network',
    color: '#00B7AE',
    disabled: false
  },
  {
    id: 'signum-brazil',
    name: 'Latin America BR',
    description: 'Featured Node from South America',
    type: 'main',
    rpcBaseURL: 'https://brazil.signum.network',
    color: '#0090A2',
    disabled: false
  },
  {
    id: 'signum-australia',
    name: 'Australia',
    description: 'Featured Node from Australia',
    type: 'main',
    rpcBaseURL: 'https://australia.signum.network',
    color: '#001b69',
    disabled: false
  },
  {
    id: 'signum-singapore',
    name: 'Asia SG',
    description: 'Featured Node from Singapore',
    type: 'main',
    rpcBaseURL: 'https://singapore.signum.network',
    color: '#001b69',
    disabled: false
  },
  {
    id: 'signum-mainnet-local',
    name: 'Local Mainnet',
    description: 'For those who run a local main net node on standard port 8125',
    type: 'main',
    rpcBaseURL: 'http://localhost:8125',
    color: '#2F4858',
    disabled: false
  },
  {
    id: 'signum-testnet-europe',
    name: 'Europe Testnet ',
    description: 'Public Testnet Node Europe',
    type: 'test',
    rpcBaseURL: 'https://europe3.testnet.signum.network',
    color: '#FFBB00',
    disabled: false
  },
  {
    id: 'signum-testnet-local',
    name: 'Local Testnet',
    description: 'For those hackers who run a local test net node on standard port 6876',
    type: 'test',
    rpcBaseURL: 'http://localhost:6876',
    color: '#CD9000',
    disabled: false
  }
];
