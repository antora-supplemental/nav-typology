'use strict'

const { stripLeadingEmoji } = require('@antora-supplemental/nav-typology/lib/strip-emoji')

module.exports = (text) => stripLeadingEmoji(text)
