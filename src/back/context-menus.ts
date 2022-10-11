import { Address } from '@signumjs/core';
import browser, { Menus } from 'webextension-polyfill';

import { XTSharedStorageKey } from 'lib/messaging';

export enum MenuItems {
  SendToAddress = 'send-to-address',
  OpenInExplorer = 'open-in-explorer'
}

function getExplorerAddressUrl(address: Address) {
  const baseUrl = address.getReedSolomonAddress().startsWith('TS-')
    ? 'https://t-chain.signum.network'
    : 'https://chain.signum.network';
  return `${baseUrl}/address/${address.getNumericId()}`;
}

async function getSelectedText() {
  const { selectedText } = await browser.storage.local.get(XTSharedStorageKey.SelectedText);
  return selectedText;
}

async function handleSendToAddress() {
  const selectedText = await getSelectedText();
  if (!selectedText) return;

  try {
    const address = Address.fromReedSolomonAddress(selectedText);

    const tabs = await browser.tabs.query({
      url: browser.runtime.getURL('/*')
    });
    const sendToUrl = browser.runtime.getURL(`/fullpage.html#/send/0/${address.getNumericId()}`);
    if (tabs.length) {
      await browser.tabs.update(tabs[0].id, {
        url: sendToUrl,
        active: true
      });
    } else {
      await browser.tabs.create({
        url: sendToUrl,
        active: true
      });
    }
  } catch (e) {
    console.warn('No valid Signum Address', selectedText);
  }
}

async function handleOpenInExplorer() {
  const selectedText = await getSelectedText();
  if (!selectedText) return;

  try {
    const address = Address.fromReedSolomonAddress(selectedText);
    await browser.tabs.create({
      url: getExplorerAddressUrl(address),
      active: true
    });
  } catch (e) {
    console.warn('No valid Signum Address', selectedText);
  }
}

export async function initContextMenu() {
  console.log('initContextMenu');
  await browser.contextMenus.removeAll();

  const [openInExplorerTitle, sendToAddressTitle] = await Promise.all([
    browser.i18n.getMessage('openInExplorer'),
    browser.i18n.getMessage('sendToAddress')
  ]);

  browser.contextMenus.create({
    id: MenuItems.OpenInExplorer,
    type: 'normal',
    title: openInExplorerTitle || 'Open in Explorer',
    contexts: ['all'],
    enabled: false
  });

  browser.contextMenus.create({
    id: 'separator-1',
    type: 'separator',
    contexts: ['all']
  });

  browser.contextMenus.create({
    id: MenuItems.SendToAddress,
    type: 'normal',
    title: sendToAddressTitle || 'Send Signa to this Address',
    contexts: ['all'],
    enabled: false
  });

  browser.contextMenus.onClicked.addListener((info: Menus.OnClickData) => {
    switch (info.menuItemId) {
      case MenuItems.OpenInExplorer:
        handleOpenInExplorer();
        break;
      case MenuItems.SendToAddress:
        handleSendToAddress();
        break;
      default:
      // do nothing
    }
  });
}

export function setMenuItemEnabled(id: MenuItems, enabled: boolean) {
  return browser.contextMenus.update(id, { enabled });
}
