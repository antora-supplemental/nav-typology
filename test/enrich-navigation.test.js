'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { stripLeadingEmoji } = require('../lib/strip-emoji')
const { enablePlugin, resetForTests } = require('../lib/plugin-api')
const { enrichNavigationForest, detectTypologyId } = require('../lib/enrich-navigation')
const { prioritizeChangelogSiblings } = require('../lib/changelog-nav')
const { mergeTypologies } = require('../lib/typologies')

describe('stripLeadingEmoji', () => {
  it('removes leading Diátaxis emoji', () => {
    assert.equal(stripLeadingEmoji('🎓 Tutorials'), 'Tutorials')
    assert.equal(stripLeadingEmoji('🛠️ How-to Guides'), 'How-to Guides')
  })
})

describe('detectTypologyId', () => {
  beforeEach(() => resetForTests())

  it('marks depth-0 forest roots as component-root', () => {
    const id = detectTypologyId(
      { content: 'General Knowledge', url: '/general-knowledge/', items: [{}] },
      { depth: 0 },
      {}
    )
    assert.equal(id, 'component-root')
  })

  it('detects Diátaxis paths when plugin enabled', () => {
    enablePlugin('diataxis')
    const id = detectTypologyId(
      { content: 'Tutorials', url: '/general-knowledge/tutorials/' },
      { depth: 1 },
      {}
    )
    assert.equal(id, 'diataxis-tutorial')
  })

  it('detects changelog paths and titles', () => {
    assert.equal(
      detectTypologyId({ content: 'Changelog', url: '/DevCentr/changelog/' }, { depth: 1 }, {}),
      'changelog'
    )
    assert.equal(
      detectTypologyId({ content: 'Activity Log', url: '/home/activity-log/' }, { depth: 1 }, {}),
      'changelog'
    )
  })
})

describe('enrichNavigationForest', () => {
  beforeEach(() => resetForTests())

  it('attaches navTypology and strips emoji', () => {
    enablePlugin('diataxis')
    const typologies = mergeTypologies()
    const out = enrichNavigationForest(
      [{ content: '🎓 Tutorials', url: '/gk/tutorials/', urlType: 'internal' }],
      { stripEmoji: true },
      typologies
    )
    assert.equal(out[0].content, 'Tutorials')
    assert.equal(out[0].navTypology.id, 'diataxis-tutorial')
  })
})

describe('prioritizeChangelogSiblings', () => {
  it('moves changelog to second slot after landing link', () => {
    const items = [
      { content: 'Dev Center', url: '/DevCentr/' },
      { content: 'Roadmap', url: '/DevCentr/todo-roadmap/' },
      { content: 'Changelog', url: '/DevCentr/changelog/' },
    ]
    const out = prioritizeChangelogSiblings(items)
    assert.deepEqual(
      out.map((i) => i.content),
      ['Dev Center', 'Changelog', 'Roadmap']
    )
  })
})
