// One-off: generate the workshop "scan to install" QR. Run: node scripts/gen-qr.mjs
// qrcode installed with --no-save (not a project dependency), same pattern as gen-icons.mjs.
import QRCode from 'qrcode';
import { writeFileSync } from 'fs';

// Points at the landing page (the workshop front door) — its "Become a tester"
// button opens the live app at https://puhuscribe-v2.vercel.app/.
const URL = 'https://puhuscribe-v2.vercel.app/landing';
const dir = 'marketing/workshop';

// On-brand lake ink on white, high error-correction + generous quiet zone for projector/phone scanning.
const opts = {
  errorCorrectionLevel: 'H',
  margin: 4,
  color: { dark: '#1B4965', light: '#FFFFFF' },
};

await QRCode.toFile(`${dir}/install-qr.png`, URL, { ...opts, type: 'png', width: 1200 });
const svg = await QRCode.toString(URL, { ...opts, type: 'svg', width: 1200 });
writeFileSync(`${dir}/install-qr.svg`, svg);
console.log('QR written for', URL);
