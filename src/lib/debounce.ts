export const debounce = (callback: any, wait: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    timeoutId && clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
};
