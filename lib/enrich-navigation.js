'use strict'

const { stripLeadingEmoji } = require('./strip-emoji')
const { isPluginEnabled, getCustomDetectors } = require('./plugin-api')

function normalizeUrl (url) {
  if (url == null || url === '') return ''
  let u = String(url).split(/[?#]/)[0]
  u = u.replace(/\/index\.html$/i, '/')
  if (u.length > 1) u = u.replace(/\/+$/, '') || '/'
  return u.toLowerCase()
}

function detectComponentRoot (item, ctx, config) {
  if (ctx.depth !== 0 || !item.content) return undefined
  const overrides = config.componentTypologies || {}
  for (const [name, typologyId] of Object.entries(overrides)) {
    if (String(item.content).includes(name) || normalizeUrl(item.url).includes(`/${name.toLowerCase()}/`)) {
      return typologyId
    }
  }
  if (item.url && Array.isArray(item.items) && item.items.length) {
    return 'component-root'
  }
  return undefined
}

function detectStructural (item) {
  const text = String(item.content || '')
  const url = normalizeUrl(item.url)
  if (/^\.?\s*components\b/i.test(text) || /\/components\//.test(url)) return 'spec-component'
  if (/^\.?\s*features\b/i.test(text) || /\/features\//.test(url)) return 'spec-feature'
  return undefined
}

function detectDiataxis (item) {
  if (!isPluginEnabled('diataxis')) return undefined
  const url = normalizeUrl(item.url)
  const text = String(item.content || '').toLowerCase()

  if (/\/tutorials(\/|$)/.test(url) || /^tutorials\b/.test(text)) return 'diataxis-tutorial'
  if (/\/how-to(\/|$)/.test(url) || /how-to/.test(text)) return 'diataxis-howto'
  if (/\/reference(\/|$)/.test(url) || /^reference\b/.test(text)) return 'diataxis-reference'
  if (/\/explanation(\/|$)/.test(url) || /^explanation\b/.test(text)) return 'diataxis-explanation'
  return undefined
}

function detectTypologyId (item, ctx, config) {
  for (const fn of getCustomDetectors()) {
    const hit = fn(item, ctx, config)
    if (hit) return hit
  }
  return (
    detectComponentRoot(item, ctx, config) ||
    detectDiataxis(item) ||
    detectStructural(item) ||
    undefined
  )
}

function enrichItem (item, ctx, config, typologies) {
  if (!item || typeof item !== 'object') return item
  const copy = { ...item }
  if (Array.isArray(copy.items) && copy.items.length) {
    copy.items = enrichItems(copy.items, { depth: ctx.depth + 1 }, config, typologies)
  }

  const explicit = copy.navTypologyId || copy.navTypology?.id
  const typologyId = explicit || detectTypologyId(copy, ctx, config)
  if (typologyId && typologies[typologyId]) {
    copy.navTypology = typologies[typologyId]
    if (config.stripEmoji !== false && copy.content) {
      copy.content = stripLeadingEmoji(copy.content)
    }
  }
  return copy
}

function enrichItems (items, ctx, config, typologies) {
  if (!Array.isArray(items)) return items
  return items.map((item) => enrichItem(item, ctx, config, typologies))
}

function enrichNavigationForest (trees, config, typologies) {
  if (!Array.isArray(trees)) return trees
  return enrichItems(trees, { depth: 0 }, config, typologies)
}

module.exports = {
  enrichNavigationForest,
  enrichItems,
  enrichItem,
  detectTypologyId,
  normalizeUrl,
}
