const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const warningThresholdBytes = 500 * 1024

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue
    }

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, results)
    } else {
      results.push(fullPath)
    }
  }

  return results
}

const largeFiles = walk(rootDir)
  .map(filePath => ({
    filePath,
    size: fs.statSync(filePath).size
  }))
  .filter(item => item.size > warningThresholdBytes)

if (largeFiles.length > 0) {
  console.warn('Large assets detected:')
  for (const item of largeFiles) {
    console.warn(`${path.relative(rootDir, item.filePath)}: ${Math.round(item.size / 1024)}KB`)
  }
}

console.log('Performance smoke check completed.')
