//utils/fingerprint.ts
export const generateDeviceFingerprint = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const freshStart = urlParams.get('fresh') === 'true';

  if (freshStart) {
    localStorage.clear();
    const randomId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('deviceFingerprint', randomId);
    return randomId;
  }

  const existing = localStorage.getItem('deviceFingerprint');
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Device fingerprint', 2, 2);

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    Math.random().toString(36),
    Date.now().toString()
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }

  const deviceId = Math.abs(hash).toString(36);
  localStorage.setItem('deviceFingerprint', deviceId);
  return deviceId;
};
