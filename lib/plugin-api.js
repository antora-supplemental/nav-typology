'use strict'

/** @typedef {(item: object, ctx: object, config: object) => string|undefined|null} TypologyDetector */

/** @type {Set<string>} */
const enabledPlugins = new Set()

/** @type {TypologyDetector[]} */
const customDetectors = []

function enablePlugin (name) {
  if (name) enabledPlugins.add(String(name))
}

function isPluginEnabled (name) {
  return enabledPlugins.has(String(name))
}

function registerDetector (fn) {
  if (typeof fn === 'function') customDetectors.push(fn)
}

function resetForTests () {
  enabledPlugins.clear()
  customDetectors.length = 0
}

function getCustomDetectors () {
  return customDetectors
}

module.exports = {
  enablePlugin,
  isPluginEnabled,
  registerDetector,
  getCustomDetectors,
  resetForTests,
}
