# Signum XT Wallet

Cryptocurrency wallet for [Signum blockchain platform](https://signum.network) as Web Extension for your Browser.<br>
Providing ability to manage Signa and interact with DApps.

![xt-wallet](https://user-images.githubusercontent.com/3920663/152850875-7b6b099a-c574-458d-95d4-4f83daa6279a.jpg)

<hr />

## 🌻 Install

You can install the wallet through the Chrome Web Store or via Mozilla Add-Ons respectively.

---

> NOTE: At this moment, the extension submission is in review. Due to the forced migration from Manifest V2 to V3 by Google, we were not able to submit the extension yet, as this is far more complicated than expected. We are working hard on this. We apologize for this inconvenience. If you cannot wait to use the wallet in Chrome and its derivates, follow the manual installation instructions:

https://github.com/signum-network/signum-xt-wallet/releases/

---

## Browser Support

| [![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png)](https://github.com/signum-network/signum-xt-wallet/releases) | [![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png)](https://addons.mozilla.org/en-US/firefox/addon/signum-xt-wallet/) | [![Brave](https://raw.githubusercontent.com/alrra/browser-logos/master/src/brave/brave_48x48.png)](https://github.com/signum-network/signum-xt-wallet/releases) | [![Opera](https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png)](https://github.com/signum-network/signum-xt-wallet/releases) | [![Edge](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png)](https://github.com/signum-network/signum-xt-wallet/releases) |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 49 & later ✔                                                                                                                                                       | 52 & later ✔                                                                                                                                                               | Latest ✔                                                                                                                                                        | 36 & later ✔                                                                                                                                                    | 79 & later ✔                                                                                                                                                 |

## 🧑‍🌾 Development

Ensure you have:

- [Node.js](https://nodejs.org) 12 or later installed
- [Yarn](https://yarnpkg.com) installed (npm might work also, but this project uses yarn)

Just clone the code base and install the dependencies

```bash
git clone https://github.com/signum-network/signum-xt-wallet.git
cd signum-xt-wallet
yarn
```

### ♻️ Run during development

Runs the extension in the development mode for Chrome target.<br>
It's recommended to use Chrome for development.

```bash
yarn start
```

> The project comes with a reload feature that recompiles and reload automatically on changes

#### 🦄 Load the extension for development

1. Enter `chrome://extensions/` as URL to open the Extension Manager.
2. Activate `Development Mode`.
3. Hit the `Load Unpacked` button and navigate to `<...>/signum-xt-wallet/dist`, select `chrome_unpacked` and open it.
4. Voilà!

### 🌄 Build a distributable

For deployment in the Chrome Web Store, Firefox Add-Ons, or Opera Extensions Store you need to builds the extension for production.
It correctly bundles in production mode and optimizes the build for the best performance.

```bash
# for Chrome by default
yarn build
```

Optional for different browsers:

```bash
# for Chrome directly
yarn build:chrome
# for Firefox directly
yarn build:firefox
# for Opera directly
yarn build:opera

# for all at once
yarn build-all
```

> The compiled code is available under `./dist`
