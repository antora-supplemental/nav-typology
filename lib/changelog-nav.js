'use strict'

function normalizeUrl (url) {
  if (url == null || url === '') return ''
  let u = String(url).split(/[?#]/)[0].toLowerCase()
  u = u.replace(/\/index\.html$/i, '/')
  if (u.length > 1) u = u.replace(/\/+$/, '') || '/'
  return u
}

/** @param {object} item nav item */
function isChangelogNavItem (item) {
  if (!item) return false
  const url = normalizeUrl(item.url)
  const text = String(item.content || '').toLowerCase().trim()
  if (/\/changelog(\/|$)/.test(url)) return true
  if (/\/activity-log(\/|$)/.test(url)) return true
  if (/^changelog\b/.test(text) || text === 'activity log') return true
  return false
}

/**
 * Hoist changelog / activity-log siblings near the top of each branch (after first landing link).
 * @param {object[]|undefined} items
 */
function prioritizeChangelogSiblings (items) {
  if (!Array.isArray(items) || items.length < 2) return items
  const idx = items.findIndex(isChangelogNavItem)
  if (idx <= 0) return items

  const changelog = items[idx]
  const rest = items.filter((_, i) => i !== idx)
  const insertAt = rest.length > 0 ? 1 : 0
  rest.splice(insertAt, 0, changelog)
  return rest
}

module.exports = {
  isChangelogNavItem,
  prioritizeChangelogSiblings,
  normalizeUrl,
}
