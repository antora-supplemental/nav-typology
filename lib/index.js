'use strict'

const { mergeTypologies } = require('./typologies')
const { enrichNavigationForest } = require('./enrich-navigation')
const { isPluginEnabled } = require('./plugin-api')
const { normalizeUrl } = require('./resolve-typology')

function normalizeList (value) {
  if (value == null || value === '') return []
  return (Array.isArray(value) ? value : String(value).split(','))
    .map((it) => String(it).trim())
    .filter(Boolean)
}

function buildExplicitByUrl (contentCatalog) {
  const map = new Map()
  if (!contentCatalog || typeof contentCatalog.findBy !== 'function') return map
  for (const page of contentCatalog.findBy({ family: 'page' })) {
    const attrs = (page.asciidoc && page.asciidoc.attributes) || {}
    const id = attrs['page-nav-typology'] || attrs['nav-typology'] || attrs.page_nav_typology
    if (!id) continue
    const url = page.pub && page.pub.url
    if (!url) continue
    const n = normalizeUrl(url)
    if (n) map.set(n, String(id))
  }
  return map
}

/**
 * Antora extension: attach uniform SVG typology metadata to nav items.
 *
 * Register after @antora-supplemental/site-nav-tree so component forest roots
 * receive typology icons. Optional @antora-supplemental/nav-typology-diataxis
 * enables Diataxis path/title detection and strips legacy nav emoji.
 *
 * Config:
 * - diataxisUrlExcludePrefixes: URL prefixes where Diataxis *path* heuristics
 *   are skipped (tree hierarchy uses /how-to/ etc. as folders, not buckets).
 *   Explicit page attrs (`:page-nav-typology:`) and item.navTypologyId still win.
 */

module.exports.register = function ({ config = {} }) {
  const typologies = mergeTypologies(config.typologies)
  const enrichConfig = {
    stripEmoji: config.stripEmoji !== false,
    componentTypologies: config.componentTypologies || {},
    diataxisUrlExcludePrefixes: normalizeList(config.diataxisUrlExcludePrefixes),
    explicitByUrl: new Map(),
  }
  const logger = this.getLogger('@antora-supplemental/nav-typology')

  this.on('playbookBuilt', ({ playbook }) => {
    const keys = playbook.site.keys || (playbook.site.keys = {})
    keys.nav_typology = 'true'
    if (isPluginEnabled('diataxis')) keys.nav_typology_diataxis = 'true'
  })

  this.on('navigationBuilt', ({ contentCatalog, navigationCatalog }) => {
    if (typeof navigationCatalog.getNavigation !== 'function') {
      logger.warn('navigationCatalog.getNavigation missing; nav-typology skipped')
      return
    }

    enrichConfig.explicitByUrl = buildExplicitByUrl(contentCatalog)

    const originalGet = navigationCatalog.getNavigation.bind(navigationCatalog)
    navigationCatalog.getNavigation = (component, version) => {
      const trees = originalGet(component, version)
      return enrichNavigationForest(trees, enrichConfig, typologies)
    }

    logger.info('Wrapped navigation catalog with typology enrichment')
  })
}
