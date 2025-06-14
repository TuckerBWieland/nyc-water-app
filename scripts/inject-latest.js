const fs = require('fs');
const path = require('path');

// Paths
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const PUBLIC_DIR = path.join(ROOT, 'public');
const latestPath = path.join(PUBLIC_DIR, 'data', 'latest.txt');
const indexPath = path.join(DIST_DIR, 'index.html');
const { pathToFileURL } = require('url');

if (!fs.existsSync(latestPath)) {
  console.error('latest.txt not found at', latestPath);
  process.exit(1);
}
if (!fs.existsSync(indexPath)) {
  console.error('index.html not found at', indexPath);
  process.exit(1);
}

const latest = fs.readFileSync(latestPath, 'utf-8').trim();

(async () => {
  const modulePath = pathToFileURL(path.join(__dirname, '../src/utils/basePath.js'));
  const { basePath } = await import(modulePath);
  const redirectUrl = `${basePath}/${latest}/`;

  const html = fs.readFileSync(indexPath, 'utf-8');
  const metaTag = `<meta http-equiv="refresh" content="0; url=${redirectUrl}">`;
  const newHtml = html.replace(/<head>/i, `<head>\n    ${metaTag}`);
  fs.writeFileSync(indexPath, newHtml);
})();

