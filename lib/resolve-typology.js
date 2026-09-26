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

function normalizePrefix (prefix) {
  if (prefix == null || prefix === '') return ''
  let p = String(prefix).toLowerCase().trim()
  if (!p.startsWith('/')) p = '/' + p
  if (p.length > 1 && !p.endsWith('/')) p += '/'
  return p
}

function urlMatchesExcludePrefix (url, prefixes) {
  if (!prefixes || !prefixes.length) return false
  const u = normalizeUrl(url)
  if (!u) return false
  const withSlash = u.endsWith('/') ? u : u + '/'
  for (const raw of prefixes) {
    const p = normalizePrefix(raw)
    if (!p) continue
    if (withSlash === p || withSlash.startsWith(p) || u === p.slice(0, -1)) return true
  }
  return false
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

function isOverviewNavItem (item) {
  if (!item) return false
  const text = String(item.content || '').toLowerCase().trim().replace(/\s+/g, ' ')
  return text === 'overview' || text === 'home'
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
 * @param {object} ctx depth, parentTypologyId, diataxisEnabled, skipBuildFallback,
 *   explicitByUrl (Map), diataxisUrlExcludePrefixes (string[])
 *
 * Precedence: item.navTypologyId > page attr map (explicitByUrl) > changelog >
 * overview/home label > Diataxis (URL unless excluded, else title for unlinked,
 * else parent inherit) > structural spec.
 */
function resolveTypologyId (item, ctx = {}) {
  if (!item || typeof item !== 'object') return undefined

  const explicit = item.navTypologyId
  if (explicit) return explicit

  const url = normalizeUrl(item.url)
  if (ctx.explicitByUrl && url) {
    const fromPage = ctx.explicitByUrl.get(url) || ctx.explicitByUrl.get(url.endsWith('/') ? url.slice(0, -1) : url + '/')
    if (fromPage) return fromPage
  }

  if (isChangelogNavItem(item)) return 'changelog'

  if (isOverviewNavItem(item)) return 'overview'

  const diataxisEnabled = ctx.diataxisEnabled === true
  const urlExcluded = urlMatchesExcludePrefix(url, ctx.diataxisUrlExcludePrefixes)

  if (diataxisEnabled) {
    if (!urlExcluded) {
      const fromUrl = detectDiataxisFromUrl(url)
      if (fromUrl) return fromUrl
    }

    if (!url) {
      const fromTitle = detectDiataxisFromTitle(item.content)
      if (fromTitle) return fromTitle
    }

    if (isDiataxisId(ctx.parentTypologyId)) return ctx.parentTypologyId
  }

  const structural = isStructuralSpec(item)
  if (structural) return structural

  if (!ctx.skipBuildFallback && item.navTypology?.id) return item.navTypology.id

  return undefined
}

module.exports = {
  normalizeUrl,
  normalizePrefix,
  urlMatchesExcludePrefix,
  detectDiataxisFromUrl,
  detectDiataxisFromTitle,
  isDiataxisId,
  isChangelogNavItem,
  isOverviewNavItem,
  resolveTypologyId,
}
