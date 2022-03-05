import './xhr-shim';
import * as semver from 'semver';
import browser, { tabs, runtime } from 'webextension-polyfill';

import { getConnectionControl, getLockUpEnabled, updateConnectionControl } from 'lib/lockup';

import { lock } from './back/actions';
import { start } from './back/main';

runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (reason === 'install') {
    openFullPage();
  } else if (reason === 'update') {
    handleUpdate(previousVersion);
  }
});

start();

// if (process.env.TARGET_BROWSER === 'safari') {
//   browser.browserAction.onClicked.addListener(() => {
//     openFullPage();
//   });
// }

function handleUpdate(previousVersion: string | undefined) {
  if (!previousVersion) return;

  if (semver.lt(previousVersion, '1.1.0')) {
    openOptionsInFullPage(previousVersion, true);
  }
}

function openOptionsInFullPage(updateFromVersion: string = '', reset: boolean = false) {
  let url = 'options.html';
  if (updateFromVersion) {
    url += `?updateFromVersion=${updateFromVersion}&reset=${reset ? 'true' : 'false'}`;
  }

  browser.tabs.create({
    url: browser.runtime.getURL(url)
  });
}

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
