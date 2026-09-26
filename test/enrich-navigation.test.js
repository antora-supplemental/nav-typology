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

  it('inherits parent Diataxis typology for linked leaves without a new bucket URL', () => {
    const id = resolveTypologyId(
      {
        content: 'Bitwarden CLI (agents)',
        url: '/agent-rules/bitwarden-cli-agents.html',
      },
      { diataxisEnabled: true, parentTypologyId: 'diataxis-howto' }
    )
    assert.equal(id, 'diataxis-howto')
  })

  it('does not inherit when URL introduces a different Diataxis bucket', () => {
    const id = resolveTypologyId(
      {
        content: 'Nushell Setup',
        url: '/general-knowledge/reference/shells/nushell.html',
      },
      { diataxisEnabled: true, parentTypologyId: 'diataxis-howto' }
    )
    assert.equal(id, 'diataxis-reference')
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


  it('propagates Diataxis typology to cross-component linked leaves', () => {
    enablePlugin('diataxis')
    const typologies = mergeTypologies()
    const { enrichItems } = require('../lib/enrich-navigation')
    const out = enrichItems(
      [
        {
          content: 'How-to Guides',
          url: '/gk/how-to/',
          items: [
            { content: 'Nushell Setup', url: '/gk/how-to/nushell-setup.html' },
            { content: 'Bitwarden CLI (agents)', url: '/agent-rules/bitwarden-cli-agents.html' },
            { content: 'gcloud CLI (agents)', url: '/agent-rules/gcloud-cli-agents.html' },
          ],
        },
      ],
      { depth: 1 },
      { stripEmoji: true },
      typologies
    )
    assert.equal(out[0].navTypology.id, 'diataxis-howto')
    assert.equal(out[0].items[0].navTypology.id, 'diataxis-howto')
    assert.equal(out[0].items[1].navTypology.id, 'diataxis-howto')
    assert.equal(out[0].items[2].navTypology.id, 'diataxis-howto')
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

  it('puts Home then Changelog before the rest', () => {
    const items = [
      { content: 'Usage', url: '/ar/usage/' },
      { content: 'Changelog', url: '/ar/changelog/' },
      { content: 'Home', url: '/ar/' },
    ]
    const out = prioritizeChangelogSiblings(items)
    assert.deepEqual(
      out.map((i) => i.content),
      ['Home', 'Changelog', 'Usage']
    )
  })

  it('treats Overview like Home for hard-sort', () => {
    const items = [
      { content: 'Usage', url: '/ar/usage/' },
      { content: 'Activity Log', url: '/home/activity-log/' },
      { content: 'Overview', url: '/ar/' },
    ]
    const out = prioritizeChangelogSiblings(items)
    assert.deepEqual(
      out.map((i) => i.content),
      ['Overview', 'Activity Log', 'Usage']
    )
  })
})


describe('overview typology', () => {
  beforeEach(() => resetForTests())

  it('detects Overview label as overview typology', () => {
    assert.equal(
      detectTypologyId({ content: 'Overview', url: '/business-bootstrap/' }, { depth: 1 }, {}),
      'overview'
    )
  })

  it('detects Home label as overview typology', () => {
    assert.equal(
      detectTypologyId({ content: 'Home', url: '/tools/' }, { depth: 1 }, {}),
      'overview'
    )
  })
})

describe('diataxisUrlExcludePrefixes + explicit page map', () => {
  beforeEach(() => resetForTests())

  it('skips URL Diataxis heuristics under excluded prefixes', () => {
    enablePlugin('diataxis')
    const id = resolveTypologyId(
      {
        content: 'Escalate DMARC policy',
        url: '/business-bootstrap/how-to/dmarc-escalation/',
      },
      {
        diataxisEnabled: true,
        diataxisUrlExcludePrefixes: ['/business-bootstrap/'],
      }
    )
    assert.equal(id, undefined)
  })

  it('honors explicitByUrl over URL heuristics', () => {
    enablePlugin('diataxis')
    const map = new Map([['/business-bootstrap/how-to/dmarc-escalation', 'diataxis-howto']])
    const id = resolveTypologyId(
      {
        content: 'Escalate DMARC policy',
        url: '/business-bootstrap/how-to/dmarc-escalation/',
      },
      {
        diataxisEnabled: true,
        diataxisUrlExcludePrefixes: ['/business-bootstrap/'],
        explicitByUrl: map,
      }
    )
    assert.equal(id, 'diataxis-howto')
  })
})


describe('nav-typology-icon helper (component-root off by default)', () => {
  const iconHelper = require('../ui/helpers/nav-typology-icon')

  it('does not render an icon for component-root by default', () => {
    const item = { content: 'Platforms', url: '/platforms/', items: [{}] }
    const html = iconHelper(item, { hash: { level: 0 }, data: { root: { site: { keys: {} }, uiRootPath: '/_' } } })
    assert.equal(html, '')
  })

  it('renders component-root icon when site.keys.nav_typology_component_root_icons is true', () => {
    const item = { content: 'Platforms', url: '/platforms/', items: [{}] }
    const html = iconHelper(item, {
      hash: { level: 0 },
      data: { root: { site: { keys: { nav_typology_component_root_icons: 'true' } }, uiRootPath: '/_' } },
    })
    assert.match(html, /nav-typology-icon--component-root/)
    assert.match(html, /icon-component-root/)
  })

  it('renders overview solid icon', () => {
    const item = { content: 'Overview', url: '/platforms/' }
    const html = iconHelper(item, {
      hash: { level: 1 },
      data: { root: { site: { keys: {} }, uiRootPath: '/_' } },
    })
    assert.match(html, /nav-typology-icon--overview/)
    assert.match(html, /icon-overview/)
  })
})
