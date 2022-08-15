#!/usr/bin/env -S yarn node
// Hey Emacs, this is -*- coding: utf-8 -*-

/* eslint-disable prefer-regex-literals */

const process = require('node:process');
const fs = require('node:fs');
const path = require('node:path');

const {
  parseCliArgs,
  loadConfig,
  loadCompDb,
  compDbUnboxEntries,
} = require('./lib');

/**
 * @param {string}  pathBoxed - path boxed
 * @returns {string | null} path unboxed
 */
const bazelSandboxUnbox = (pathBoxed) => {
  const boxRegex = RegExp('/bazel/.+?/sandbox/.+?/execroot/[^/]+?/(.+)');
  const pathMatch = pathBoxed.match(boxRegex);

  if (pathMatch == null || pathMatch[1] == null) {
    return null;
  }

  return pathMatch[1];
};

/** @type {import("./lib").PathUnbox} */
const pathUnbox = (pathType, pathBoxed, config, rootPath) => {
  let pathUnboxed = null;

  for (const ignoreRegexp of config.ignorePaths) {
    if (pathBoxed.match(ignoreRegexp)) {
      return '';
    }
  }

  for (const { predicate, replacement } of config.pathReplacements) {
    if (pathBoxed.match(predicate)) {
      pathUnboxed = pathBoxed.replace(predicate, replacement);
      break;
    }
  }

  if (pathUnboxed == null) {
    pathUnboxed = bazelSandboxUnbox(pathBoxed);
  }

  if (pathUnboxed == null) {
    pathUnboxed = pathBoxed;
  }

  if (path.isAbsolute(pathUnboxed)) {
    pathUnboxed = path.relative(rootPath, pathUnboxed);
  }

  if (!fs.existsSync(path.join(rootPath, pathUnboxed))) {
    throw Error(
      `Path ${pathType} ${path.join(rootPath, pathUnboxed)} does not exist.`,
    );
  }

  console.log(pathType, pathUnboxed);
  return pathUnboxed;
};

const cliParams = parseCliArgs(process.argv);

process.chdir(cliParams.bazelWorkspacePath);

const unboxConfig = loadConfig(cliParams.configPath);
const compDbIn = loadCompDb(cliParams.compDbInPath);

const compDbOut = compDbUnboxEntries(
  compDbIn,
  unboxConfig,
  cliParams.bazelWorkspacePath,
  pathUnbox,
);

fs.writeFileSync(cliParams.compDbOutPath, JSON.stringify(compDbOut, null, 2));
