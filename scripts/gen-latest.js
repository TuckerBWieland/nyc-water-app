const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const latestPath = path.join(PUBLIC_DIR, 'data', 'latest.txt');

if (!fs.existsSync(latestPath)) {
  console.error('latest.txt not found at', latestPath);
  process.exit(1);
}

const latest = fs.readFileSync(latestPath, 'utf-8').trim();
const outDir = path.join(ROOT, 'src', 'generated');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'latest-date.js');
fs.writeFileSync(outFile, `export default '${latest}';\n`);
