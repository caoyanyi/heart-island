const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const maxMediaAssetSize = 200000
const maxMediaAssetTotalSize = 200000
const mediaAssetExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.mp3',
  '.wav',
  '.mp4',
  '.mov'
])

function walk(dir, matcher, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue
    }

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, matcher, results)
    } else if (!matcher || matcher(fullPath)) {
      results.push(fullPath)
    }
  }

  return results
}

function formatSize(bytes) {
  return `${Math.round((bytes / 1024) * 10) / 10}KB`
}

function runCheck(label, command, args) {
  console.log(`\n${label}`)
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit'
  })
}

function getMediaAssets() {
  return walk(rootDir, filePath => mediaAssetExtensions.has(path.extname(filePath).toLowerCase()))
    .map(filePath => ({
      filePath,
      relativePath: path.relative(rootDir, filePath),
      size: fs.statSync(filePath).size
    }))
    .sort((a, b) => b.size - a.size)
}

function printProjectSummary() {
  const appJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'app.json'), 'utf8'))
  const mediaAssets = getMediaAssets()
  const oversizedAssets = mediaAssets.filter(item => item.size > maxMediaAssetSize)
  const totalMediaSize = mediaAssets.reduce((sum, item) => sum + item.size, 0)

  console.log('\nRelease Summary')
  console.log(`Pages: ${appJson.pages.length}`)
  console.log(`Media assets: ${mediaAssets.length}`)
  console.log(`Single media size limit: ${formatSize(maxMediaAssetSize)}`)
  console.log(`Total media size limit: ${formatSize(maxMediaAssetTotalSize)}`)
  console.log(`Total media size: ${formatSize(totalMediaSize)}`)

  if (mediaAssets.length > 0) {
    console.log('\nLargest media assets:')
    mediaAssets.slice(0, 5).forEach(item => {
      console.log(`- ${item.relativePath}: ${formatSize(item.size)}`)
    })
  }

  if (oversizedAssets.length > 0) {
    console.error('\nOversized media assets:')
    oversizedAssets.forEach(item => {
      console.error(`- ${item.relativePath}: ${formatSize(item.size)}`)
    })
    process.exitCode = 1
  } else if (totalMediaSize > maxMediaAssetTotalSize) {
    console.error(`\nTotal media assets exceed 200K: ${formatSize(totalMediaSize)}`)
    process.exitCode = 1
  } else {
    console.log('\nAll media assets are within the 200K single-file and total limits.')
  }
}

runCheck('Static project checks', process.execPath, ['test/test-suite.js'])
runCheck('Performance smoke check', process.execPath, ['test/performance-test.js'])
printProjectSummary()

if (process.exitCode) {
  throw new Error('Release check failed')
}
