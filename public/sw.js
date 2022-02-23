/* eslint-disable */
try {
  const window = globalThis;
  // This is the file produced by webpack
  importScripts('background.js');
} catch (e) {
  // This will allow you to see error logs during registration/execution
  console.error(e);
}
