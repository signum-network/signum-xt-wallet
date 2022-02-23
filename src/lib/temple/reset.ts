import Browser from 'webextension-polyfill';

import * as Repo from 'lib/temple/repo';

export async function clearStorage() {
  await Repo.db.delete();
  await Browser.storage.local.clear();
  // await localStorage.clear();
}
