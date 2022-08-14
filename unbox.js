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
  const fileUnboxed = pathUnbox(file, config, rootPath);

  const commandPartsIn = tokeniseCommand(command);

  const commandPartsOut = commandPartsIn.reduce((result, value) => {
    const valueMatch = value.match(/^(-I|-isystem|-iquote|-c)\s*(.*?)(\s*)$/);

    if (valueMatch) {
      let pathOrig = valueMatch[2];

      if (pathOrig === '.') {
        result.push(value);
        return result;
      }

      // Strip quatations if any
      pathOrig = pathOrig.replace(/^["']?(.+?)["']?$/, '$1');
      pathOrig = path.normalize(pathOrig);

      let pathUnboxed = pathUnbox(pathOrig, config, rootPath);

      // Add quotations to paths with white spaces
      if (pathUnboxed.match(/\s/)) {
        pathUnboxed = `"${pathUnboxed}"`;
      }

      // eslint-disable-next-line no-param-reassign
      value = `${valueMatch[1]} ${pathUnboxed}${valueMatch[3]}`;
      result.push(value);
    } else {
      result.push(value);
    }

    return result;
  }, /** @type {string[]} */ ([]));

  let commandUnboxed = commandPartsOut.join(' ');
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
