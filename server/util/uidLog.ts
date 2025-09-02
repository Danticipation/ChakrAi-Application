// HIPAA-compliant logging utility
// Only logs UID-related information when explicitly enabled
export const uidLog = (...args: any[]) => {
  if (process.env['UID_VERBOSE'] === '1') {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

export const uidError = (...args: any[]) => {
  // Always log errors, but respect verbose flag for detail level
  if (process.env['UID_VERBOSE'] === '1') {
    // eslint-disable-next-line no-console
    console.error(...args);
  } else {
    // eslint-disable-next-line no-console
    console.error('Authentication error occurred');
  }
};
