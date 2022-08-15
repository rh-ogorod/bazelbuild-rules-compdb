// Hey Emacs, this is -*- coding: utf-8 -*-

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const tokeniseCommand = (/** @type {string} */ command) => {
  // Regexp selects quoted strings handling excaped characters
  let commandParts = command.trim().split(/(['"])((?:[^\1\\]|\\.)*?\1)/g);

  // Re-split commandParts into white space and not-white space
  // respecting quatations and excaped characters
  commandParts = commandParts.reduce((result, value) => {
    let last;
    if (result.length > 0) {
      last = result[result.length - 1];
    } else {
      last = '';
    }

    if (last === '"' || last === "'") {
      result[result.length - 1] += value;
    } else if (value === '"' || value === "'") {
      result.push(value);
    } else {
      // Regexp selects non-white-space strings respecting escaped
      // white-space symbols
      // eslint-disable-next-line no-param-reassign
      result = result.concat(value.split(/([^\s](?:[^\s\\]|\\.)*)/g));
    }

    return result;
  }, /** @type {string[]} */ ([]));

  // Re-join parts into LCI command options and parameters
  commandParts = commandParts.reduce((result, value) => {
    if (value === '') {
      return result;
    }

    let last;
    if (result.length > 0) {
      last = result[result.length - 1];
    } else {
      last = '';
    }

    if (
      last.match(/^(?:-I|-isystem|-iquote)\s*$/) ||
      last.match(/=\s*$/) ||
      value.match(/^\s+$/)
    ) {
      result[result.length - 1] += value;
    } else {
      result.push(value);
    }

    return result;
  }, /** @type {string[]} */ ([]));

  commandParts = commandParts.map((value) => value.trim());

  return commandParts;
};

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
 *   ignorePaths: RegExp[],
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
 * @typedef {{
 *   '-I': string[],
 *   '-isystem': string[],
 *   '-iquote': string[],
 * }} CompDbEntryPaths
 */

/**
 * @param {CompDbEntryPaths}  compDbEntryPaths - comp db entry paths
 * @param {UnboxConfig}  config - unbox config
 * @param {string}  rootPath - root path for paths in comp db
 * @param {PathUnbox}  pathUnbox - path unboxing function
 * @returns {CompDbEntryPaths} output compilation database
 */
const compDbEntryPathsUnbox = (
  compDbEntryPaths,
  config,
  rootPath,
  pathUnbox,
) => {
  const compDbEntryPathsSetUnboxed = {
    '-I': /** @type {Set<string>} */ (new Set()),
    '-isystem': /** @type {Set<string>} */ (new Set()),
    '-iquote': /** @type {Set<string>} */ (new Set()),
  };

  /** @type {[keyof CompDbEntryPaths, string[]][]} */
  (Object.entries(compDbEntryPaths)).forEach(([pathType, pathsBoxed]) => {
    pathsBoxed.forEach((pathBoxed) => {
      const pathUnboxed = pathUnbox(pathType, pathBoxed, config, rootPath);

      if (pathUnboxed === '') {
        return;
      }

      // Remove duplicates using Set
      compDbEntryPathsSetUnboxed[pathType].add(pathUnboxed);
    });
  });

  return Object.entries(compDbEntryPathsSetUnboxed).reduce(
    (result, [pathType, pathsSetUnboxed]) => {
      result[pathType] = [...pathsSetUnboxed];
      return result;
    },
    /** @type {CompDbEntryPaths} */ ({}),
  );
};

/**
 * @typedef {(
 *   pathType: 'file' | '-I' | '-isystem' | '-iquote',
 *   pathBoxed: string,
 *   config: UnboxConfig,
 *   rootPath: string
 * ) => string} PathUnbox
 */

/**
 * @param {CompDbEntry}  compDbEntry - input comp db
 * @param {UnboxConfig}  config - unbox config
 * @param {string}  rootPath - root path for paths in comp db
 * @param {PathUnbox}  pathUnbox - path unboxing function
 * @returns {CompDbEntry} output compilation database
 */
const compDbEntryUnbox = ({ command, file }, config, rootPath, pathUnbox) => {
  /** @type {CompDbEntryPaths} */
  const compDbEntryPaths = {
    '-I': [],
    '-isystem': [],
    '-iquote': [],
  };

  const fileUnboxed = pathUnbox('file', file, config, rootPath);

  const commandPartsIn = tokeniseCommand(command);

  const commandPartsOut = commandPartsIn.reduce((result, commandPartIn) => {
    const valueMatch = commandPartIn.match(
      /^(-I|-isystem|-iquote)\s*(.*?)(\s*)$/,
    );

    if (valueMatch) {
      const pathType = /** @type {'-I' | '-isystem' | '-iquote'} */ (
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

  console.log('******', commandPartsOut);
  // let commandUnboxed = commandPartsOut
  //   .slice(0, commandPartsOut.length - 1)
  //   .concat(commandPathsParts)
  //   .slice(commandPartsOut.length - 2)
  //   .join(' ');
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
 * @param {CompDbEntry[]}  compDb - input comp db
 * @param {UnboxConfig}  config - unbox config
 * @param {string}  rootPath - root path for paths in comp db
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
 * @param {string}  compDbPath - unbox config path
 * @returns {CompDbEntry[]} loaded compilation database
 */
const loadCompDb = (compDbPath) => {
  const compDbString = fs.readFileSync(compDbPath, 'utf8');

  return JSON.parse(compDbString);
};

/**
 * @param {string}  [configPath] - unbox config path
 * @returns {UnboxConfig} loaded config
 */
const loadConfig = (configPath) => {
  const configDefault = {
    pathReplacements: [],
    ignorePaths: [],
    additionalIncludes: [],
  };

  if (configPath === undefined) {
    return configDefault;
  }

  /* eslint-disable import/no-dynamic-require, global-require */

  // /** @type {UnboxConfig} */
  const userConfig = require(configPath);

  /* eslint-enable import/no-dynamic-require, global-require */

  return { ...configDefault, ...userConfig };
};

module.exports = {
  compDbUnboxEntries,
  parseCliArgs,
  loadCompDb,
  loadConfig,
};
