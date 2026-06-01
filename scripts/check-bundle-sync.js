const fs = require('fs');
const crypto = require('crypto');

const groups = [
  ['game bundle', [
    'index.html',
    'www/index.html',
    'ios/App/App/public/index.html'
  ]],
  ['manifest', [
    'manifest.json',
    'www/manifest.json',
    'ios/App/App/public/manifest.json'
  ]],
  ['service worker', [
    'sw.js',
    'www/sw.js',
    'ios/App/App/public/sw.js'
  ]],
  ['app icon', [
    'app-icon.png',
    'www/app-icon.png',
    'ios/App/App/public/app-icon.png'
  ]]
];

function hash(path) {
  return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex').slice(0, 12);
}

let failed = false;

for (const [label, files] of groups) {
  const missing = files.filter((file) => !fs.existsSync(file));
  if (missing.length) {
    console.error(`Missing ${label} files:`, missing.join(', '));
    failed = true;
    continue;
  }

  const hashes = files.map(hash);
  if (!hashes.every((value) => value === hashes[0])) {
    files.forEach((file, index) => console.error(`${hashes[index]}  ${file}`));
    console.error(`${label} sync mismatch`);
    failed = true;
  } else {
    console.log(`${label} sync OK (${hashes[0]}, ${files.length} files match)`);
  }
}

if (failed) process.exit(1);
