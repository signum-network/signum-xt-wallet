import './xhr-shim';
import { tabs, runtime, storage } from 'webextension-polyfill';

import { getConnectionControl, getLockUpEnabled, updateConnectionControl } from 'lib/lockup';

import { lock } from './back/actions';
import { start } from './back/main';

runtime.onInstalled.addListener(({ reason }) => (reason === 'install' ? openFullPage() : null));

start();

// if (process.env.TARGET_BROWSER === 'safari') {
//   browser.browserAction.onClicked.addListener(() => {
//     openFullPage();
//   });
// }

function openFullPage() {
  tabs.create({
    url: runtime.getURL('fullpage.html')
  });
}

runtime.onConnect.addListener(async externalPort => {
  const LockTimeout = 5 * 60_000;
  const [lockUpEnabled, connection] = await Promise.all([getLockUpEnabled(), getConnectionControl()]);
  connection.count++;

  updateConnectionControl(connection);
  if (
    connection.count === 1 &&
    connection.disconnectTimestamp !== 0 &&
    Date.now() - connection.disconnectTimestamp >= LockTimeout &&
    lockUpEnabled
  ) {
    lock();
  }
  externalPort.onDisconnect.addListener(() => {
    connection.count--;
    if (connection.count === 0) {
      connection.disconnectTimestamp = Date.now();
    }
    updateConnectionControl(connection);
  });
});
