// TypeScript version of inject-latest.js with enhanced type safety
import * as fs from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'
import { fileURLToPath } from 'url'

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Type definitions
interface BasePathModule {
  basePath: string
}

interface ProcessingPaths {
  root: string
  distDir: string
  publicDir: string
  latestPath: string
  indexPath: string
}

/**
 * Initialize and validate all required file paths
 * @returns Validated paths object
 * @throws Error if required files don't exist
 */
function initializePaths(): ProcessingPaths {
  const root = path.resolve(__dirname, '..')
  const distDir = path.join(root, 'dist')
  const publicDir = path.join(root, 'public')
  const latestPath = path.join(publicDir, 'data', 'latest.txt')
  const indexPath = path.join(distDir, 'index.html')

  // Validate required files exist
  if (!fs.existsSync(latestPath)) {
    throw new Error(`latest.txt not found at ${latestPath}`)
  }

  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found at ${indexPath}`)
  }

  return {
    root,
    distDir,
    publicDir,
    latestPath,
    indexPath
  }
}

/**
 * Read and validate the latest date from latest.txt
 * @param latestPath - Path to latest.txt file
 * @returns Trimmed latest date string
 * @throws Error if file cannot be read or is empty
 */
function readLatestDate(latestPath: string): string {
  try {
    const latest = fs.readFileSync(latestPath, 'utf-8').trim()
    
    if (!latest) {
      throw new Error('latest.txt is empty')
    }

    // Basic date format validation (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!datePattern.test(latest)) {
      console.warn(`⚠️  Warning: latest date "${latest}" doesn't match expected YYYY-MM-DD format`)
    }

    return latest
  } catch (error) {
    throw new Error(`Failed to read latest.txt: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Dynamically import basePath utility with proper typing
 * @param rootPath - Root project path
 * @returns Promise resolving to basePath value
 * @throws Error if basePath module cannot be imported
 */
async function importBasePath(rootPath: string): Promise<string> {
  try {
    const moduleUrl = pathToFileURL(path.join(rootPath, 'src/utils/basePath.js'))
    const module = await import(moduleUrl.href) as BasePathModule
    
    if (typeof module.basePath !== 'string') {
      throw new Error('basePath is not a string or is undefined')
    }

    return module.basePath
  } catch (error) {
    throw new Error(`Failed to import basePath: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Inject meta redirect tag into HTML content
 * @param htmlContent - Original HTML content
 * @param redirectUrl - URL to redirect to
 * @returns Modified HTML content with meta redirect
 */
function injectMetaRedirect(htmlContent: string, redirectUrl: string): string {
  const metaTag = `<meta http-equiv="refresh" content="0; url=${redirectUrl}">`
  
  // Look for opening <head> tag (case insensitive)
  const headRegex = /<head>/i
  const match = htmlContent.match(headRegex)
  
  if (!match) {
    throw new Error('Could not find <head> tag in HTML content')
  }

  // Inject meta tag after <head>
  const modifiedHtml = htmlContent.replace(headRegex, `<head>\n    ${metaTag}`)
  
  return modifiedHtml
}

/**
 * Write modified HTML content to index.html
 * @param indexPath - Path to index.html file
 * @param htmlContent - Modified HTML content to write
 * @throws Error if file cannot be written
 */
function writeIndexHtml(indexPath: string, htmlContent: string): void {
  try {
    fs.writeFileSync(indexPath, htmlContent, 'utf-8')
    console.log(`✅ Successfully injected redirect into ${indexPath}`)
  } catch (error) {
    throw new Error(`Failed to write index.html: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Main execution function with comprehensive error handling
 */
async function main(): Promise<void> {
  try {
    console.log('🔄 Injecting latest date redirect into index.html...')

    // Initialize and validate paths
    const paths = initializePaths()
    console.log(`📁 Using latest date from: ${paths.latestPath}`)
    console.log(`📄 Modifying index.html at: ${paths.indexPath}`)

    // Read latest date
    const latest = readLatestDate(paths.latestPath)
    console.log(`📅 Latest date: ${latest}`)

    // Import basePath dynamically
    const basePath = await importBasePath(paths.root)
    console.log(`🔗 Base path: ${basePath || '(root)'}`)

    // Construct redirect URL
    const redirectUrl = `${basePath}/${latest}/`
    console.log(`🎯 Redirect URL: ${redirectUrl}`)

    // Read current HTML content
    const htmlContent = fs.readFileSync(paths.indexPath, 'utf-8')

    // Inject meta redirect
    const modifiedHtml = injectMetaRedirect(htmlContent, redirectUrl)

    // Write modified HTML
    writeIndexHtml(paths.indexPath, modifiedHtml)

    console.log('🎉 Meta redirect injection completed successfully!')

  } catch (error) {
    console.error('❌ Error during meta redirect injection:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Execute main function
main() 