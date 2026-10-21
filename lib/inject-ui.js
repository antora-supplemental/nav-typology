'use strict'

const fs = require('node:fs')
const path = require('node:path')

const UI_ROOT = path.join(__dirname, '..', 'ui')
const PKG_VERSION = require('../package.json').version

function walkUiFiles (dir = UI_ROOT, base = UI_ROOT) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkUiFiles(full, base))
    } else if (entry.isFile()) {
      files.push(path.relative(base, full).split(path.sep).join('/'))
    }
  }
  return files
}

function addOrReplacePartial (uiCatalog, stem, relPath, contents) {
  const existing = uiCatalog.findByType('partial').find((f) => f.stem === stem)
  if (existing) {
    existing.contents = contents
    return
  }
  uiCatalog.addFile({
    contents,
    path: relPath,
    stem,
    type: 'partial',
  })
}

function addOrReplaceHelper (uiCatalog, stem, relPath, contents) {
  const existing = uiCatalog.findByType('helper').find((f) => f.stem === stem)
  if (existing) {
    existing.contents = contents
    return
  }
  uiCatalog.addFile({
    contents,
    path: relPath,
    stem,
    type: 'helper',
  })
}

function addOrReplaceAsset (uiCatalog, uiOutputDir, relPath, contents) {
  const existing = uiCatalog.findByType('asset').find((f) => f.path === relPath)
  if (existing) {
    existing.contents = contents
    return
  }
  const dirname = path.posix.dirname(relPath)
  const basename = path.posix.basename(relPath)
  const outDir = dirname === '.' ? uiOutputDir : `${uiOutputDir}/${dirname}`
  uiCatalog.addFile({
    contents,
    type: 'asset',
    path: relPath,
    out: {
      dirname: outDir,
      path: `${outDir}/${basename}`,
      basename,
    },
  })
}

function appendToPartial (uiCatalog, stems, line) {
  const list = Array.isArray(stems) ? stems : [stems]
  for (const stem of list) {
    const partial = uiCatalog.findByType('partial').find((f) => f.stem === stem)
    if (!partial) continue
    const body = Buffer.isBuffer(partial.contents)
      ? partial.contents.toString('utf8')
      : String(partial.contents || '')
    if (body.includes(line)) return true
    partial.contents = Buffer.from(`${body.trim()}\n${line}\n`)
    return true
  }
  return false
}

function appendStylesheetLink (uiCatalog, href) {
  const tag = `<link rel="stylesheet" href="{{{uiRootPath}}}/${href}">`
  if (appendToPartial(uiCatalog, 'head-meta', tag)) return
  appendToPartial(uiCatalog, 'footer-content', tag)
}

/**
 * Merge companion UI from this package into the Antora UI catalog (replaces stale hub copies).
 *
 * @param {import('@antora/types').UiCatalog} uiCatalog
 * @param {string} uiOutputDir
 */
function injectNavTypologyUi (uiCatalog, uiOutputDir) {
  const skipPartials = new Set(['head-nav-typology-css'])

  for (const rel of walkUiFiles()) {
    const full = path.join(UI_ROOT, rel)
    const contents = fs.readFileSync(full)

    if (rel.startsWith('partials/') && rel.endsWith('.hbs')) {
      const stem = path.basename(rel, '.hbs')
      if (skipPartials.has(stem)) continue
      addOrReplacePartial(uiCatalog, stem, rel, contents)
      continue
    }

    if (rel.startsWith('helpers/') && rel.endsWith('.js')) {
      const stem = path.basename(rel, '.js')
      addOrReplaceHelper(uiCatalog, stem, rel, contents)
      continue
    }

    if (rel.startsWith('css/') || rel.startsWith('img/') || rel.startsWith('js/')) {
      addOrReplaceAsset(uiCatalog, uiOutputDir, rel, contents)
    }
  }

  appendStylesheetLink(uiCatalog, `css/nav-typology.css?v=${PKG_VERSION}`)
}

module.exports = { injectNavTypologyUi }
