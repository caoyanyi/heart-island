const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const rootDir = path.resolve(__dirname, '..')

function walk(dir, matcher, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue
    }

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, matcher, results)
    } else if (matcher(fullPath)) {
      results.push(fullPath)
    }
  }

  return results
}

function parseJsonFile(filePath) {
  JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const jsFiles = walk(rootDir, filePath => filePath.endsWith('.js'))
for (const filePath of jsFiles) {
  execFileSync(process.execPath, ['--check', filePath], { stdio: 'pipe' })
}

const jsonFiles = walk(rootDir, filePath => filePath.endsWith('.json'))
for (const filePath of jsonFiles) {
  parseJsonFile(filePath)
}

const appJsonPath = path.join(rootDir, 'app.json')
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
assert(Array.isArray(appJson.pages), 'app.json must include a pages array')

for (const page of appJson.pages) {
  const pageBase = path.join(rootDir, page)
  assert(fs.existsSync(`${pageBase}.js`), `Missing page script: ${page}.js`)
  assert(fs.existsSync(`${pageBase}.wxml`), `Missing page template: ${page}.wxml`)
}

if (appJson.sitemapLocation) {
  assert(
    fs.existsSync(path.join(rootDir, appJson.sitemapLocation)),
    `Missing sitemap file: ${appJson.sitemapLocation}`
  )
}

console.log(`Validated ${jsFiles.length} JS files, ${jsonFiles.length} JSON files, and ${appJson.pages.length} pages.`)
