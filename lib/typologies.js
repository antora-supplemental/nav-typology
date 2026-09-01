'use strict'

/** @typedef {{ id: string, spriteId: string, label: string }} Typology */

/** @type {Record<string, Typology>} */
const DEFAULT_TYPOLOGIES = {
  'component-root': {
    id: 'component-root',
    spriteId: 'icon-component-root',
    label: 'Component',
  },
  'spec-component': {
    id: 'spec-component',
    spriteId: 'icon-spec-component',
    label: 'Component spec',
  },
  'spec-feature': {
    id: 'spec-feature',
    spriteId: 'icon-spec-feature',
    label: 'Feature spec',
  },
  'diataxis-tutorial': {
    id: 'diataxis-tutorial',
    spriteId: 'icon-diataxis-tutorial',
    label: 'Tutorial',
  },
  'diataxis-howto': {
    id: 'diataxis-howto',
    spriteId: 'icon-diataxis-howto',
    label: 'How-to',
  },
  'diataxis-reference': {
    id: 'diataxis-reference',
    spriteId: 'icon-diataxis-reference',
    label: 'Reference',
  },
  'diataxis-explanation': {
    id: 'diataxis-explanation',
    spriteId: 'icon-diataxis-explanation',
    label: 'Explanation',
  },
  changelog: {
    id: 'changelog',
    spriteId: 'icon-changelog',
    label: 'Changelog',
  },
}

function mergeTypologies (overrides = {}) {
  const merged = { ...DEFAULT_TYPOLOGIES }
  for (const [id, value] of Object.entries(overrides || {})) {
    if (!value) continue
    merged[id] = {
      id,
      spriteId: value.spriteId || DEFAULT_TYPOLOGIES[id]?.spriteId || `icon-${id}`,
      label: value.label || DEFAULT_TYPOLOGIES[id]?.label || id,
    }
  }
  return merged
}

module.exports = {
  DEFAULT_TYPOLOGIES,
  mergeTypologies,
}
