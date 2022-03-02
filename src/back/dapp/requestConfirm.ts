import browser, { Runtime } from 'webextension-polyfill';

import { TempleDAppPayload, XTMessageType, TempleRequest } from 'lib/messaging';

import { intercom } from '../defaults';

const CONFIRM_WINDOW_WIDTH = 400;
const CONFIRM_WINDOW_HEIGHT = 640;
const AUTODECLINE_AFTER = 120_000;

type RequestConfirmParams = {
  id: string;
  payload: TempleDAppPayload;
  onDecline: () => void;
  handleIntercomRequest: (req: TempleRequest, decline: () => void) => Promise<any>;
};

export async function requestConfirm({ id, payload, onDecline, handleIntercomRequest }: RequestConfirmParams) {
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;

    try {
      stopTimeout();
      stopRequestListening();
      stopWinRemovedListening();

      await closeWindow();
    } catch (_err) {}
  };

  const declineAndClose = () => {
    onDecline();
    close();
  };

  let knownPort: Runtime.Port | undefined;
  const stopRequestListening = intercom.onRequest(async (req: TempleRequest, port) => {
    if (req?.type === XTMessageType.DAppGetPayloadRequest && req.id === id) {
      knownPort = port;

      return {
        type: XTMessageType.DAppGetPayloadResponse,
        payload
      };
    } else {
      if (knownPort !== port) return;

      const result = await handleIntercomRequest(req, onDecline);
      if (result) {
        close();
        return result;
      }
    }
  });

  const isWin = (await browser.runtime.getPlatformInfo()).os === 'win';

  let left = 0;
  let top = 0;
  try {
    const lastFocused = await browser.windows.getLastFocused();
    // Position window in top right corner of lastFocused window.

    top = Math.round(lastFocused.top! + lastFocused.height! / 2 - CONFIRM_WINDOW_HEIGHT / 2);
    left = Math.round(lastFocused.left! + lastFocused.width! / 2 - CONFIRM_WINDOW_WIDTH / 2);
  } catch {
    // The following properties are more than likely 0, due to being
    // opened from the background chrome process for the extension that
    // has no physical dimensions
    const { screenX, screenY, outerWidth, outerHeight } = window;
    top = Math.round(screenY + outerHeight / 2 - CONFIRM_WINDOW_HEIGHT / 2);
    left = Math.round(screenX + outerWidth / 2 - CONFIRM_WINDOW_WIDTH / 2);
  }

  const confirmWin = await browser.windows.create({
    type: 'popup',
    url: browser.runtime.getURL(`confirm.html#?id=${id}`),
    width: isWin ? CONFIRM_WINDOW_WIDTH + 16 : CONFIRM_WINDOW_WIDTH,
    height: isWin ? CONFIRM_WINDOW_HEIGHT + 17 : CONFIRM_WINDOW_HEIGHT,
    top: Math.max(top, 20),
    left: Math.max(left, 20)
  });

  // Firefox currently ignores left/top for create, but it works for update
  if (confirmWin.id && confirmWin.left !== left && confirmWin.state !== 'fullscreen') {
    await browser.windows.update(confirmWin.id, { left, top });
  }

  const closeWindow = async () => {
    if (confirmWin.id) {
      const win = await browser.windows.get(confirmWin.id);
      if (win.id) {
        await browser.windows.remove(win.id);
      }
    }
  };

  const handleWinRemoved = (winId: number) => {
    if (winId === confirmWin?.id) {
      declineAndClose();
    }
  };
  browser.windows.onRemoved.addListener(handleWinRemoved);
  const stopWinRemovedListening = () => browser.windows.onRemoved.removeListener(handleWinRemoved);

  // Decline after timeout
  const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
  const stopTimeout = () => clearTimeout(t);
}
