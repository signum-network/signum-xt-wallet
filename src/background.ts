import './xhr-shim';
import { tabs, runtime } from 'webextension-polyfill';

import { lock } from 'lib/temple/back/actions';
import { start } from 'lib/temple/back/main';
// import { isLockUpEnabled } from 'lib/ui/useLockUp';

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

const LOCK_TIME = 5 * 60_000;
let disconnectTimestamp = 0;
let connectionsCount = 0;

runtime.onConnect.addListener(externalPort => {
  connectionsCount++;
  // const lockUpEnabled = isLockUpEnabled();
  if (
    connectionsCount === 1 &&
    Date.now() - disconnectTimestamp >= LOCK_TIME &&
    disconnectTimestamp !== 0
    // lockUpEnabled
  ) {
    lock();
  }
  externalPort.onDisconnect.addListener(() => {
    connectionsCount--;
    if (connectionsCount === 0) {
      disconnectTimestamp = Date.now();
    }
  });
});
