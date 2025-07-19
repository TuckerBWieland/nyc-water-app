import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexPath = path.join(distDir, 'index.html')
const notFoundPath = path.join(distDir, '404.html')

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath)
} else {
  console.error('index.html not found. Did you run the build?')
  process.exit(1)
} 