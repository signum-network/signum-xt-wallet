import browser, { omnibox } from 'webextension-polyfill';

export function initOmnibox() {
  omnibox.onInputChanged.addListener(async (text, suggest) => {
    const suggestions = [
      {
        description: 'Resolve Signum Domain: ' + text,
        content: `https://${text}.signum`
      },
      {
        description: 'Search Explorer for: ' + text,
        content: `https://explorer.signum.network/search/?q=${text}&submit=Search`
      },
      {
        description: 'Send SIGNA To: ' + text,
        content: browser.runtime.getURL(`/fullpage.html#/send/0/${text}`)
      }
    ];
    suggest(suggestions);
  });

  omnibox.onInputEntered.addListener(async url => {
    await browser.tabs.update({ url });
  });
}
