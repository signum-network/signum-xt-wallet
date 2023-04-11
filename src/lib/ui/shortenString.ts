export const shortenString = (str: string, trimOffset: number = 12): string => {
  const offset = trimOffset / 2;
  return str.length > trimOffset ? str.substring(0, offset) + '…' + str.substring(str.length - offset) : str;
};
