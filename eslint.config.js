// Hey Emacs, this is -*- coding: utf-8 -*-

/* eslint-disable @typescript-eslint/no-var-requires */

const config = require('@rh-ogorod/js-configs/base/eslint.config');

module.exports = {
  ...config,
  rules: {
    ...config.rules,
    '@typescript-eslint/no-var-requires': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'no-console': 'off',
  },
};
