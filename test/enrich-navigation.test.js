'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { stripLeadingEmoji } = require('../lib/strip-emoji')
const { enablePlugin, resetForTests } = require('../lib/plugin-api')
const { enrichNavigationForest, detectTypologyId } = require('../lib/enrich-navigation')
const { prioritizeChangelogSiblings } = require('../lib/changelog-nav')
const { mergeTypologies } = require('../lib/typologies')
const { resolveTypologyId } = require('../lib/resolve-typology')

describe('stripLeadingEmoji', () => {
  it('removes leading Diátaxis emoji', () => {
    assert.equal(stripLeadingEmoji('🎓 Tutorials'), 'Tutorials')
    assert.equal(stripLeadingEmoji('🛠️ How-to Guides'), 'How-to Guides')
  })
})

describe('resolveTypologyId', () => {
  it('prefers explanation URL over reference title prefix', () => {
    const id = resolveTypologyId(
      {
        content: 'Reference reliability',
        url: '/general-knowledge/explanation/internet-architecture/reliability/reference-reliability.html',
      },
      { diataxisEnabled: true }
    )
    assert.equal(id, 'diataxis-explanation')
  })

  it('inherits parent Diátaxis typology for unlinked section headers', () => {
    const id = resolveTypologyId(
      { content: 'Internet Reliability' },
      { diataxisEnabled: true, parentTypologyId: 'diataxis-explanation' }
    )
    assert.equal(id, 'diataxis-explanation')
  })

  it('does not title-match linked pages without bucket URL', () => {
    const id = resolveTypologyId(
      { content: 'Reference reliability', url: '/general-knowledge/explanation/foo.html' },
      { diataxisEnabled: true }
    )
    assert.equal(id, 'diataxis-explanation')
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

  it('propagates Diátaxis typology to unlinked child headers', () => {
    enablePlugin('diataxis')
    const typologies = mergeTypologies()
    const { enrichItems } = require('../lib/enrich-navigation')
    const out = enrichItems(
      [
        {
          content: 'Explanation',
          url: '/gk/explanation/',
          items: [{ content: 'Internet Reliability', items: [] }],
        },
      ],
      { depth: 1 },
      { stripEmoji: true },
      typologies
    )
    assert.equal(out[0].navTypology.id, 'diataxis-explanation')
    assert.equal(out[0].items[0].navTypology.id, 'diataxis-explanation')
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
