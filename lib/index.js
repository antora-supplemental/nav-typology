'use strict'

const { mergeTypologies } = require('./typologies')
const { enrichNavigationForest } = require('./enrich-navigation')

/**
 * Antora extension: attach uniform SVG typology metadata to nav items.
 *
 * Register after @antora-supplemental/site-nav-tree so component forest roots
 * receive typology icons. Optional @antora-supplemental/nav-typology-diataxis
 * enables Diátaxis path/title detection and strips legacy nav emoji.
 */

module.exports.register = function ({ config = {} }) {
  const typologies = mergeTypologies(config.typologies)
  const enrichConfig = {
    stripEmoji: config.stripEmoji !== false,
    componentTypologies: config.componentTypologies || {},
  }
  const logger = this.getLogger('@antora-supplemental/nav-typology')

  this.on('playbookBuilt', ({ playbook }) => {
    const keys = playbook.site.keys || (playbook.site.keys = {})
    keys.nav_typology = 'true'
  })

  this.on('navigationBuilt', ({ navigationCatalog }) => {
    if (typeof navigationCatalog.getNavigation !== 'function') {
      logger.warn('navigationCatalog.getNavigation missing; nav-typology skipped')
      return
    }

    const originalGet = navigationCatalog.getNavigation.bind(navigationCatalog)
    navigationCatalog.getNavigation = (component, version) => {
      const trees = originalGet(component, version)
      return enrichNavigationForest(trees, enrichConfig, typologies)
    }

    logger.info('Wrapped navigation catalog with typology enrichment')
  })
}
