'use strict'

function normalizeUrl (url) {
  if (url == null || url === '') return ''
  let u = String(url).split(/[?#]/)[0].toLowerCase()
  u = u.replace(/\/index\.html$/i, '/')
  if (u.length > 1) u = u.replace(/\/+$/, '') || '/'
  return u
}

function navLabel (item) {
  return String((item && item.content) || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

/** @param {object} item nav item */
function isHomeNavItem (item) {
  if (!item) return false
  const text = navLabel(item)
  return text === 'home' || text === 'overview'
}

/** @param {object} item nav item */
function isChangelogNavItem (item) {
  if (!item) return false
  const url = normalizeUrl(item.url)
  const text = navLabel(item)
  if (/\/changelog(\/|$)/.test(url)) return true
  if (/\/activity-log(\/|$)/.test(url)) return true
  if (/^changelog\b/.test(text) || text === 'activity log') return true
  return false
}

/**
 * Order siblings: Home/Overview first, then changelog / activity-log, then rest.
 * When no Home/Overview is present, keep the former hoist (changelog at index 1
 * after the first landing link) so titles like "Dev Center" stay first.
 * @param {object[]|undefined} items
 */
function prioritizeChangelogSiblings (items) {
  if (!Array.isArray(items) || items.length < 2) return items

  const home = []
  const changelog = []
  const rest = []
  for (const item of items) {
    if (isHomeNavItem(item)) home.push(item)
    else if (isChangelogNavItem(item)) changelog.push(item)
    else rest.push(item)
  }

  if (home.length) return home.concat(changelog, rest)

  // No Home/Overview: changelog after first landing link (legacy).
  if (!changelog.length) return items
  const landing = rest[0]
  const after = rest.slice(1)
  if (!landing) return changelog.concat(after)
  return [landing].concat(changelog, after)
}

module.exports = {
  isHomeNavItem,
  isChangelogNavItem,
  prioritizeChangelogSiblings,
  normalizeUrl,
}
