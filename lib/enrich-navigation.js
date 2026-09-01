'use strict'

const { stripLeadingEmoji } = require('./strip-emoji')
const { isPluginEnabled, getCustomDetectors } = require('./plugin-api')
const { prioritizeChangelogSiblings } = require('./changelog-nav')
const { normalizeUrl, resolveTypologyId } = require('./resolve-typology')

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

function detectTypologyId (item, ctx, config) {
  for (const fn of getCustomDetectors()) {
    const hit = fn(item, ctx, config)
    if (hit) return hit
  }
  const componentRoot = detectComponentRoot(item, ctx, config)
  if (componentRoot) return componentRoot
  return resolveTypologyId(item, {
    depth: ctx.depth,
    parentTypologyId: ctx.parentTypologyId,
    diataxisEnabled: isPluginEnabled('diataxis'),
    skipBuildFallback: true,
  })
}

function enrichItem (item, ctx, config, typologies) {
  if (!item || typeof item !== 'object') return item
  const copy = { ...item }

  const explicit = copy.navTypologyId
  const typologyId = explicit || detectTypologyId(copy, ctx, config)
  if (typologyId && typologies[typologyId]) {
    copy.navTypology = typologies[typologyId]
    if (config.stripEmoji !== false && copy.content) {
      copy.content = stripLeadingEmoji(copy.content)
    }
  }

  const childParent = typologyId || ctx.parentTypologyId
  if (Array.isArray(copy.items) && copy.items.length) {
    copy.items = enrichItems(
      copy.items,
      { depth: ctx.depth + 1, parentTypologyId: childParent },
      config,
      typologies
    )
  }

  return copy
}

function enrichItems (items, ctx, config, typologies) {
  if (!Array.isArray(items)) return items
  const enriched = items.map((item) => enrichItem(item, ctx, config, typologies))
  return prioritizeChangelogSiblings(enriched)
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
