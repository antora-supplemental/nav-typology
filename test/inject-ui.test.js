'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { injectNavTypologyUi } = require('../lib/inject-ui')

function mockCatalog (partials = {}) {
  const partialFiles = []
  const helperFiles = []
  const assetFiles = []
  for (const [stem, body] of Object.entries(partials)) {
    partialFiles.push({ stem, contents: Buffer.from(body), type: 'partial' })
  }
  return {
    partialFiles,
    helperFiles,
    assetFiles,
    findByType (type) {
      if (type === 'partial') return partialFiles
      if (type === 'helper') return helperFiles
      if (type === 'asset') return assetFiles
      return []
    },
    addFile (file) {
      if (file.type === 'partial') partialFiles.push(file)
      else if (file.type === 'helper') helperFiles.push(file)
      else if (file.type === 'asset') assetFiles.push(file)
    },
  }
}

test('injectNavTypologyUi adds helpers, nav-tree partial, sprite, and head-meta stylesheet', () => {
  const uiCatalog = mockCatalog({
    'head-meta': '<meta charset="utf-8">\n',
  })
  injectNavTypologyUi(uiCatalog, '_')

  assert.ok(uiCatalog.helperFiles.some((f) => f.stem === 'nav-typology-icon'))
  assert.ok(uiCatalog.partialFiles.some((f) => f.stem === 'nav-tree'))
  assert.ok(uiCatalog.assetFiles.some((f) => f.path === 'img/nav-typology.svg'))

  const head = uiCatalog.partialFiles.find((f) => f.stem === 'head-meta').contents.toString('utf8')
  assert.match(head, /nav-typology\.css/)
})

test('injectNavTypologyUi replaces stale supplemental copies', () => {
  const uiCatalog = mockCatalog({})
  uiCatalog.assetFiles.push({
    type: 'asset',
    path: 'css/nav-typology.css',
    contents: Buffer.from('/* stale */'),
  })
  uiCatalog.partialFiles.push({
    type: 'partial',
    stem: 'nav-tree',
    contents: Buffer.from('{{!-- stale --}}'),
  })

  injectNavTypologyUi(uiCatalog, '_')

  const css = uiCatalog.assetFiles.find((f) => f.path === 'css/nav-typology.css').contents.toString('utf8')
  assert.doesNotMatch(css, /stale/)
  assert.match(css, /--nav-typology-icon-size/)
})
