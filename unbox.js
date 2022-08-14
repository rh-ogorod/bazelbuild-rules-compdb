#!/usr/bin/env -S yarn node
// Hey Emacs, this is -*- coding: utf-8 -*-

/* eslint-disable prefer-regex-literals */

const process = require('node:process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { tokeniseCommand } = require('./lib');

/**
 * @typedef {{
 *   bazelWorkspacePath: string,
 *   compDbOutPath: string,
 *   compDbInPath: string,
 *   configPath?: string,
 * }} CliParams
 */

/**
 * @typedef {{
 *   pathReplacements: { predicate: RegExp, replacement: string }[],
 *   additionalIncludes: { type: string, path: string }[],
 * }} UnboxConfig
 */

/**
 * @typedef {{
 *   command: string,
 *   file: string,
 *   directory: string,
 * }} CompDbEntry
 */

/**
 * @param {string[]}  argv - CLI arguments
 * @returns {CliParams} This is the result
 */
const parseCliArgs = (argv) => {
  const args = argv.slice(2);

  if (!(args.length === 3 || args.length === 4)) {
    throw new Error(
      [
        'Usage: unbox.js',
        'out/path/to/compile_commands.json',
        'in/path/to/compile_commands.json',
        'path/to/bazel/workspace',
        '[path/to/unbox/config]',
      ].join(' '),
    );
  }

  const compDbOutPath = args[0].replace('~', os.homedir);

  const compDbInPath = args[1].replace('~', os.homedir);

  if (!fs.existsSync(compDbInPath)) {
    throw Error(`${compDbInPath} file does not exist`);
  }

  const bazelWorkspacePath = args[2].replace('~', os.homedir);

  if (!fs.existsSync(bazelWorkspacePath)) {
    throw Error(`${bazelWorkspacePath} bazelWorkspacePath does not exist`);
  }

  let configPath;

  if (args[3] !== undefined) {
    configPath = args[3].replace('~', os.homedir);

    if (!fs.existsSync(configPath)) {
      throw Error(`${configPath} unbox config does not exist`);
    }
  }

  return {
    bazelWorkspacePath,
    compDbOutPath,
    compDbInPath,
    configPath,
  };
};

/**
 * @param {string}  [configPath] - unbox config path
 * @returns {UnboxConfig} loaded config
 */
const loadConfig = (configPath) => {
  const configDefault = {
    pathReplacements: [],
    additionalIncludes: [],
  };

  if (configPath === undefined) {
    return configDefault;
  }

  // const userConfigString = fs.readFileSync(configPath, 'utf8');

  // /** @type {UnboxConfig} */
  // const userConfig = JSON.parse(userConfigString);

  /* eslint-disable import/no-dynamic-require, global-require */

  // /** @type {UnboxConfig} */
  const userConfig = require(configPath);

  /* eslint-enable import/no-dynamic-require, global-require */

  return { ...configDefault, ...userConfig };
};

/**
 * @param {string}  compDbPath - unbox config path
 * @returns {CompDbEntry[]} loaded compilation database
 */
const loadCompDb = (compDbPath) => {
  const compDbString = fs.readFileSync(compDbPath, 'utf8');

  return JSON.parse(compDbString);
};

/**
 * @typedef {{
 *   '-I': string[],
 *   '-isystem': string[],
 *   '-iquote': string[],
 *   '-c': string[],
 * }} CompDbEntryPaths
 */

/**
 * @param {CompDbEntryPaths}  paths - compillation database classified paths
 * @param {UnboxConfig}  config - unbox config
 * @param {string}  rootPath - root path for paths in compillation database
 * @param {PathUnbox}  pathUnbox - path unboxing function
 * @returns {CompDbEntryPaths} output compilation database
 */
const compDbEntryPathsUnbox = (paths, config, rootPath, pathUnbox) => {
  return paths;
};

/**
 * @typedef {(
 *   pathIn: string,
 *   config: UnboxConfig,
 *   rootPath: string
 * ) => string} PathUnbox
 */

/**
 * @param {CompDbEntry}  compDbEntry - input compillation database
 * @param {UnboxConfig}  config - unbox config
 * @param {string}  rootPath - root path for paths in compillation database
 * @param {PathUnbox}  pathUnbox - path unboxing function
 * @returns {CompDbEntry} output compilation database
 */
const compDbEntryUnbox = ({ command, file }, config, rootPath, pathUnbox) => {
  /** @type {CompDbEntryPaths} */
  const compDbEntryPaths = {
    '-I': [],
    '-isystem': [],
    '-iquote': [],
    '-c': [],
  };

  const fileUnboxed = pathUnbox(file, config, rootPath);

  const commandPartsIn = tokeniseCommand(command);

  const commandPartsOut = commandPartsIn.reduce((result, commandPartIn) => {
    const valueMatch = commandPartIn.match(
      /^(-I|-isystem|-iquote|-c)\s*(.*?)(\s*)$/,
    );

    if (valueMatch) {
      const pathType = /** @type {'-I' | '-isystem' | '-iquote' | '-c'} */ (
        valueMatch[1]
      );

      const pathOrig = valueMatch[2];

      if (pathOrig === '.') {
        result.push(commandPartIn);
        return result;
      }

      // Strip quatations if any
      const pathOrigClean = path.normalize(
        pathOrig.replace(/^["']?(.+?)["']?$/, '$1'),
      );

      compDbEntryPaths[pathType].push(pathOrigClean);

      // let pathUnboxed = pathUnbox(pathOrigClean, config, rootPath);

      // // Add quotations to paths with white spaces
      // if (pathUnboxed.match(/\s/)) {
      //   pathUnboxed = `"${pathUnboxed}"`;
      // }

      // const commandPartOut = `${pathType} ${pathUnboxed}`;
      // result.push(commandPartOut);
    } else {
      result.push(commandPartIn);
    }

    return result;
  }, /** @type {string[]} */ ([]));

  const compDbEntryPathsUnboxed = compDbEntryPathsUnbox(
    compDbEntryPaths,
    config,
    rootPath,
    pathUnbox,
  );

  const commandPathsParts = Object.entries(compDbEntryPathsUnboxed).reduce(
    (result, [pathType, pathsUnboxed]) => {
      pathsUnboxed.forEach((pathUnboxed) => {
        const pathUnboxedQuoted = pathUnboxed.match(/\s/)
          ? `"${pathUnboxed}"`
          : pathUnboxed;

        result.push(`${pathType} ${pathUnboxedQuoted}`);
      });

      return result;
    },
    /** @type {string[]} */ ([]),
  );

  let commandUnboxed = commandPartsOut.concat(commandPathsParts).join(' ');
  commandUnboxed = commandUnboxed.replace(
    / +-fno-canonical-system-headers/,
    '',
  );

  return {
    command: commandUnboxed,
    file: fileUnboxed,
    directory: rootPath,
  };
};

/**
 * @param {CompDbEntry[]}  compDb - input compillation database
 * @param {UnboxConfig}  config - unbox config
 * @param {string}  rootPath - root path for paths in compillation database
 * @param {PathUnbox}  pathUnbox - path unboxing function
 * @returns {CompDbEntry[]} output compilation database
 */
const compDbUnboxEntries = (compDb, config, rootPath, pathUnbox) => {
  /** @type {CompDbEntry[]} */
  const result = [];

  compDb.forEach((compDbEntry) => {
    result.push(compDbEntryUnbox(compDbEntry, config, rootPath, pathUnbox));
  });

  return result;
};

const cliParams = parseCliArgs(process.argv);

process.chdir(cliParams.bazelWorkspacePath);

const unboxConfig = loadConfig(cliParams.configPath);
const compDbIn = loadCompDb(cliParams.compDbInPath);

const compDbOut = compDbUnboxEntries(
  compDbIn,
  unboxConfig,
  cliParams.bazelWorkspacePath,
  (inPath, config, rootPath) => {
    console.log(inPath);
    return inPath;
  },
);

fs.writeFileSync(cliParams.compDbOutPath, JSON.stringify(compDbOut, null, 2));
