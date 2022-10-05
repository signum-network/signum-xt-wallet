# Changelog

## 1.3.0 (TBR)

- Added Token Support
- Removed automatic Hex detection for P2P messages (#50)

### Bugfixes

- Fixed P2P Message rendering failure on messages to self

## 1.2.3

### Enhancements

- Showing all balances now (total, available, committed, reserved) (#39)
- Not closing messages when mouse over P2P messages (#38)

### Bugfixes

- Fixed undervalued fee estimate for small messages in sendEncryptedMessage

## 1.2.2

### Hotfix

- Distribution Transaction as Sender does not break anymore

## 1.2.1

### Bugfixes

- Shows correct value from Token Holder Distribution (#36)
- Binary Message pops up only when detected Hex code (#35)
- Firefox text size (#34)

## 1.2

### New feature

- Full support for Encrypted P2P messages (#31)
- Enhanced Transaction Typing (#16)

### Bugfixes

- Show wrong Alias (#30)
- Adjust confirm window size on Windows (#29)
- More stable Port Connection in app itself (#32)

## 1.1.2

### New feature

- Skip Onboarding possible now (#25)

### Bugfixes

- Mitigate Connection Loss on Chrome/Chromium (#24)

## 1.1.1

### Bugfixes

- Connection Error for single accounts (#20)
- Identicon for Contract Creation (#6)

## 1.1.0

---

Manifest Version 3 Compatible

---

This version was significantly refactored:

- to be conformant with the new Manifest Version 3 format
- DApp permission relies on DApp Url and Network now
- storage identifiers refactored
- added the DApp notification system

#### This version requires the previous installation to be reset or removed!

### New features

- Text/Data Message Attachments on Send
- New Languages: Thai, Ukrainian
- Improved Onboarding
- DApp permission relies on DApp Url and Network
- Sends notifications about Network/Account changes, Permission/Account removals to DApp
- Currency Symbol TestNet vs MainNet (#8)
- Explorer Links for Account (#9)
- Considering reserved/locked balances (#14)

### Bugfixes

- Cropped Node Urls (#7)
- Reset action redirects to Full Page Options now (no layout issues)

## 1.0.2

### Improvements and Bugfixes

- Fixes property issue in Portuguese translation
- Updated Russian Translation
- Fixes Multi Out value (#19)
- Minor "Korrektur" in German translation (#26)
- Fixed layout issues (#16, #22)
- Updated Terms and Conditions Links (#15)

## 1.0.1

### Bugfixes

- Activation in Mainnet fixed
- Added Success message for Activation
- Minor Language Selection bug fixed
- Improved Translations

## 1.0.0

Initial Release for Signum
