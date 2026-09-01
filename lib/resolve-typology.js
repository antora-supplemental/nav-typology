'use strict'

const DIATAXIS_IDS = new Set([
  'diataxis-tutorial',
  'diataxis-howto',
  'diataxis-reference',
  'diataxis-explanation',
])

function normalizeUrl (url) {
  if (url == null || url === '') return ''
  let u = String(url).split(/[?#]/)[0]
  u = u.replace(/\/index\.html$/i, '/')
  if (u.length > 1) u = u.replace(/\/+$/, '') || '/'
  return u.toLowerCase()
}

function detectDiataxisFromUrl (url) {
  if (/\/tutorials(\/|$)/.test(url)) return 'diataxis-tutorial'
  if (/\/how-to(\/|$)/.test(url)) return 'diataxis-howto'
  if (/\/reference(\/|$)/.test(url)) return 'diataxis-reference'
  if (/\/explanation(\/|$)/.test(url)) return 'diataxis-explanation'
  return null
}

function detectDiataxisFromTitle (text) {
  const t = String(text || '').toLowerCase()
  if (/^\.?\s*tutorials\b/.test(t)) return 'diataxis-tutorial'
  if (/^\.?\s*how-to/.test(t)) return 'diataxis-howto'
  if (/^\.?\s*reference\b/.test(t)) return 'diataxis-reference'
  if (/^\.?\s*explanation\b/.test(t)) return 'diataxis-explanation'
  return null
}

function isDiataxisId (id) {
  return Boolean(id && DIATAXIS_IDS.has(id))
}

function isChangelogNavItem (item) {
  const url = normalizeUrl(item.url)
  const text = String(item.content || '').toLowerCase()
  return (
    /\/changelog(\/|$)/.test(url) ||
    /\/activity-log(\/|$)/.test(url) ||
    /^\.?\s*changelog\b/.test(text) ||
    text === 'activity log'
  )
}

function isStructuralSpec (item) {
  const url = normalizeUrl(item.url)
  const text = String(item.content || '')
  if (/^\.?\s*components\b/i.test(text) || /\/components\//.test(url)) return 'spec-component'
  if (/^\.?\s*features\b/i.test(text) || /\/features\//.test(url)) return 'spec-feature'
  return null
}

/**
 * Resolve a nav item typology id.
 * @param {object} item
 * @param {object} ctx depth, parentTypologyId, diataxisEnabled, skipBuildFallback
 */
function resolveTypologyId (item, ctx = {}) {
  if (!item || typeof item !== 'object') return undefined

  const explicit = item.navTypologyId
  if (explicit) return explicit

  if (isChangelogNavItem(item)) return 'changelog'

  const url = normalizeUrl(item.url)
  const diataxisEnabled = ctx.diataxisEnabled === true

  if (diataxisEnabled) {
    const fromUrl = detectDiataxisFromUrl(url)
    if (fromUrl) return fromUrl

    if (!url) {
      const fromTitle = detectDiataxisFromTitle(item.content)
      if (fromTitle) return fromTitle
      if (isDiataxisId(ctx.parentTypologyId)) return ctx.parentTypologyId
    }
  }

  const structural = isStructuralSpec(item)
  if (structural) return structural

  if (!ctx.skipBuildFallback && item.navTypology?.id) return item.navTypology.id

  return undefined
}

module.exports = {
  normalizeUrl,
  detectDiataxisFromUrl,
  detectDiataxisFromTitle,
  isDiataxisId,
  isChangelogNavItem,
  resolveTypologyId,
}
