const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('404.html created for GitHub Pages routing');
} else {
  console.error('index.html not found. Did you run the build?');
  process.exit(1);
}
