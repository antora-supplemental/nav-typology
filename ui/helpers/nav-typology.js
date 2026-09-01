'use strict'

const { detectTypologyId } = require('@antora-supplemental/nav-typology/lib/enrich-navigation')
const { mergeTypologies } = require('@antora-supplemental/nav-typology/lib/typologies')

const typologies = mergeTypologies()

/**
 * Infer typology for a nav-tree item at render time.
 */
module.exports = (item, options = {}) => {
  if (!item || typeof item !== 'object') return null
  const level = options.hash?.level ?? 0
  const id = item.navTypology?.id || detectTypologyId(item, { depth: Number(level) || 0 }, {})
  if (!id) return null
  return typologies[id] || null
}
