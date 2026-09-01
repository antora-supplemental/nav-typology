'use strict'

const TYPOLOGIES = {
  'component-root': { id: 'component-root', spriteId: 'icon-component-root', label: 'Component' },
  'spec-component': { id: 'spec-component', spriteId: 'icon-spec-component', label: 'Component spec' },
  'spec-feature': { id: 'spec-feature', spriteId: 'icon-spec-feature', label: 'Feature spec' },
  'diataxis-tutorial': { id: 'diataxis-tutorial', spriteId: 'icon-diataxis-tutorial', label: 'Tutorial' },
  'diataxis-howto': { id: 'diataxis-howto', spriteId: 'icon-diataxis-howto', label: 'How-to' },
  'diataxis-reference': { id: 'diataxis-reference', spriteId: 'icon-diataxis-reference', label: 'Reference' },
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

function normalizeUrl (url) {
  if (url == null || url === '') return ''
  let u = String(url).split(/[?#]/)[0].toLowerCase()
  u = u.replace(/\/index\.html$/i, '/')
  if (u.length > 1) u = u.replace(/\/+$/, '') || '/'
  return u
}

function diataxisEnabled ({ data } = {}) {
  const keys = (data && data.root && data.root.site && data.root.site.keys) || {}
  return keys.nav_typology_diataxis === 'true'
}

function resolveTypology (item, options = {}) {
  if (!item || typeof item !== 'object') return null
  const level = options.hash?.level ?? 0
  const depth = Number(level) || 0
  const url = normalizeUrl(item.url)
  const text = String(item.content || '').toLowerCase()
  const diataxis = diataxisEnabled(options)

  let id = null
  if (depth === 0 && item.url && Array.isArray(item.items) && item.items.length) {
    id = 'component-root'
  } else if (/\/changelog(\/|$)/.test(url) || /\/activity-log(\/|$)/.test(url) || /^changelog\b/.test(text) || text === 'activity log') {
    id = 'changelog'
  } else if (diataxis) {
    if (/\/tutorials(\/|$)/.test(url) || /^\.?\s*tutorials\b/.test(text)) id = 'diataxis-tutorial'
    else if (/\/how-to(\/|$)/.test(url) || /^\.?\s*how-to/.test(text)) id = 'diataxis-howto'
    else if (/\/reference(\/|$)/.test(url) || /^\.?\s*reference\b/.test(text)) id = 'diataxis-reference'
    else if (/\/explanation(\/|$)/.test(url) || /^\.?\s*explanation\b/.test(text)) id = 'diataxis-explanation'
  }

  if (!id) {
    if (/^\.?\s*components\b/i.test(text) || /\/components\//.test(url)) id = 'spec-component'
    else if (/^\.?\s*features\b/i.test(text) || /\/features\//.test(url)) id = 'spec-feature'
  }

  return id ? TYPOLOGIES[id] : null
}

module.exports = (item, options = {}) => {
  const meta = resolveTypology(item, options)
  if (!meta) return ''
  const uiRoot = options.data?.root?.uiRootPath || options.data?.root?.siteRootPath || '/_'
  return (
    `<svg class="nav-typology-icon nav-typology-icon--${meta.id}" width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">` +
    `<use href="${uiRoot}/img/nav-typology.svg#${meta.spriteId}"/></svg>`
  )
}
