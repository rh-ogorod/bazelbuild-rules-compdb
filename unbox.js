#!/usr/bin/env -S yarn node
// Hey Emacs, this is -*- coding: utf-8 -*-

/* eslint-disable prefer-regex-literals */

const process = require('node:process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { tokeniseCommand } = require('./lib');

/**
 * @typedef {{
 *   bazelAdditionalIncludes: { type: string, path: string }[],
 *   bazelReplacements: Record<string, string>,
 * }} Config
 */

/** @type {Config} */
let config = {
  bazelAdditionalIncludes: [],
  bazelReplacements: {},
};

const bazelBuildRootExternalRegex = RegExp('^external(?:/(.+))$');

const bazelOutExternalRegex = RegExp(
  '^bazel-out/k8-fastbuild/bin/external(?:/(.+))$',
);

const packagesRelPathStr = 'packages';

const unboxBuildRootLocal = (
  /** @type {string} */ file,
  /** @type {string} */ bazelWorkspacePath,
) => {
  /** @type {string | null} */
  let fileUnboxed = null;

  // Strip quatations if any
  const fileUnquoted = file.replace(/^["']?(.+?)["']?$/, '$1');

  if (fileUnquoted === '.') {
    fileUnboxed = bazelWorkspacePath;
  }
  if (path.isAbsolute(fileUnquoted) && fs.existsSync(fileUnquoted)) {
    fileUnboxed = fileUnquoted;
  } else if (fs.existsSync(path.join(bazelWorkspacePath, fileUnquoted))) {
    fileUnboxed = path.join(bazelWorkspacePath, fileUnquoted);
  }

  // if (fileUnboxed != null) {
  //   return path.relative(bazelWorkspacePath, fileUnboxed);
  // }

  return fileUnboxed;
};

const unboxBuildRootExternal = (
  /** @type {string} */ file,
  /** @type {string} */ bazelWorkspacePath,
) => {
  /** @type {string | null} */
  let fileUnboxed = null;

  // Strip quatations if any
  const fileUnquoted = file.replace(/^["']?(.+?)["']?$/, '$1');

  // buildRootExternal may only be relative.
  // Such as "external/host/server/s600-host.cpp"
  // The following regexp match should cantch non-anbsolutes,
  // but leaving implicit check here to ease human logic.
  if (path.isAbsolute(fileUnquoted)) {
    return null;
  }

  const pathMatch = fileUnquoted.match(bazelBuildRootExternalRegex);

  if (pathMatch == null || pathMatch[1] == null) {
    return null;
  }

  const relPathStr = pathMatch[1];

  const replacedPaths = Object.keys(config.bazelExternalReplacements);
  const replacedPathIndex = replacedPaths.findIndex((replacedPath) => {
    return relPathStr.startsWith(replacedPath);
  });

  if (replacedPathIndex > -1) {
    const replacedPath = replacedPaths[replacedPathIndex];
    const replacementPathStr = config.bazelExternalReplacements[replacedPath];

    // Empty string is used to indicate that this path
    // should be excluded.
    if (replacementPathStr === '') {
      return '';
    }

    const pathStr = replacementPathStr + relPathStr.slice(replacedPath.length);
    const absPathStr = path.join(bazelWorkspacePath, pathStr);

    if (fs.existsSync(absPathStr)) {
      fileUnboxed = absPathStr;
    } else {
      throw new Error(
        [
          `Bazel external replacement path = "${replacementPathStr}"`,
          `for the origianl bazel build root path "${relPathStr}"`,
          'does not exist.',
        ].join(' '),
      );
    }
  } else {
    // Check for possible "external" directory in Bazel build root.
    let absPathStr = path.join(bazelWorkspacePath, fileUnquoted);

    if (fs.existsSync(absPathStr)) {
      fileUnboxed = absPathStr;
    } else {
      // Replace "external" by a directory in Bazel build root
      // that contains "packages".
      absPathStr = path.join(
        bazelWorkspacePath,
        packagesRelPathStr,
        relPathStr,
      );

      if (fs.existsSync(absPathStr)) {
        fileUnboxed = absPathStr;
      }
    }
  }

  // Add quatations if necessary
  if (fileUnboxed != null && fileUnboxed.match(/\s/)) {
    fileUnboxed = `"${fileUnboxed}"`;
  }

  // if (fileUnboxed != null) {
  //   return path.relative(bazelWorkspacePath, fileUnboxed);
  // }

  return fileUnboxed;
};

const unboxBuildOutExternal = (
  /** @type {string} */ file,
  /** @type {string} */ bazelWorkspacePath,
) => {
  /** @type {string | null} */
  let fileUnboxed = null;

  // Strip quatations if any
  const fileUnquoted = file.replace(/^["']?(.+?)["']?$/, '$1');

  // buildRootExternal may only be relative.
  // Such as "external/host/server/s600-host.cpp"
  // The following regexp match should catch non-anbsolutes,
  // but leaving implicit check here to ease human logic.
  if (path.isAbsolute(fileUnquoted)) {
    return null;
  }

  // TODO: '.' and '..(/.*)?' paths must be computed from the externally
  //       provided build root.

  // fileUnquoted = "bazel-out/k8-fastbuild/bin/external/wt/wt/include"
  const pathMatch = fileUnquoted.match(bazelOutExternalRegex);

  if (pathMatch == null || pathMatch[1] == null) {
    return null;
  }

  const relPathStr = pathMatch[1];

  if (relPathStr in config.bazelExternalReplacements) {
    const replacementPathStr = config.bazelExternalReplacements[relPathStr];

    // Empty string is used to indicate that this path
    // should be excluded.
    if (replacementPathStr === '') {
      return '';
    }

    const absPathStr = path.join(bazelWorkspacePath, replacementPathStr);

    if (fs.existsSync(absPathStr)) {
      fileUnboxed = absPathStr;
    }
    // } else if (relPathStr.match(/^.+\/_virtual_includes/)) {
    //   const absPathStr = path.join(bazelWorkspacePath, fileUnquoted);
  } else {
    const absPathStr = path.join(bazelWorkspacePath, fileUnquoted);

    if (fs.existsSync(absPathStr)) {
      fileUnboxed = absPathStr;
    } else {
      return null;
    }
  }

  // Add quatations if necessary
  if (fileUnboxed?.match(/\s/)) {
    fileUnboxed = `"${fileUnboxed}"`;
  }

  // if (fileUnboxed != null) {
  //   return path.relative(bazelWorkspacePath, fileUnboxed);
  // }

  return fileUnboxed;
};

/**
 * @typedef {{
 *   command: string,
 *   file: string,
 *   directory: string,
 * }} CompDbEntry
 */

const unbox = (
  /** @type {CompDbEntry} */ { command, file },
  /** @type {string} */ bazelWorkspacePath,
) => {
  const fileUnboxed =
    unboxBuildRootLocal(file, bazelWorkspacePath) ??
    unboxBuildRootExternal(file, bazelWorkspacePath);

  if (fileUnboxed == null) {
    throw new Error(
      `"${fileUnboxed}" does not exist. Original file = "${file}."`,
    );
  }

  let commandParts = tokeniseCommand(command);

  commandParts = commandParts.reduce((result, value) => {
    const valueMatch = value.match(/^(-I|-isystem|-iquote|-c)\s*(.*?)(\s*)$/);
    if (valueMatch) {
      const pathStr = valueMatch[2];

      let unboxedPathStr = unboxBuildRootLocal(pathStr, bazelWorkspacePath);

      if (unboxedPathStr == null) {
        unboxedPathStr = unboxBuildRootExternal(pathStr, bazelWorkspacePath);
      }

      if (unboxedPathStr == null) {
        unboxedPathStr = unboxBuildOutExternal(pathStr, bazelWorkspacePath);
      }

      if (unboxedPathStr === '') {
        return result;
      }

      if (unboxedPathStr == null) {
        throw new Error(`"${pathStr}" cannot be unboxed."`);
      }

      const unboxedValue = `${valueMatch[1]} ${unboxedPathStr}${valueMatch[3]}`;
      if (result.findIndex((v) => v.trim() === unboxedValue.trim()) < 0) {
        result.push(unboxedValue);
      }
    } else {
      result.push(value);
    }
    return result;
  }, /** @type {string[]} */ ([]));

  config.bazelAdditionalIncludes.forEach((include) => {
    if (!['-I', '-isystem', '-iquote'].includes(include.type)) {
      throw new Error(
        [
          `bazelAdditionalIncludes type in "${include}".`,
          'Only allowed types are -I, -isystem, -iquote.',
        ].join(' '),
      );
    }

    const absPathStr = path.join(bazelWorkspacePath, include.path);

    if (!fs.existsSync(absPathStr)) {
      throw new Error(
        `bazelAdditionalIncludes path "${absPathStr}" does not exist."`,
      );
    }

    commandParts.push(`${include.type} ${absPathStr}`);
  });

  let commandUnboxed = commandParts.join(' ');
  commandUnboxed = commandUnboxed.replace(
    / +-fno-canonical-system-headers/,
    '',
  );

  return {
    command: commandUnboxed,
    // directory: '.',
    directory: bazelWorkspacePath,
    file: fileUnboxed,
  };
};

const args = process.argv.slice(2);

if (!(args.length === 2 || args.length === 3)) {
  throw new Error(
    [
      'Usage: unbox path/to/compile_commands.json',
      'bazel/workspace/path [include/prefix/path]',
    ].join(' '),
  );
}

const compileCommandsPath = args[0].replace('~', os.homedir);

if (!fs.existsSync(compileCommandsPath)) {
  throw Error(`${compileCommandsPath} file does not exist`);
}

const bazelWorkspacePath = args[1].replace('~', os.homedir);

if (!fs.existsSync(bazelWorkspacePath)) {
  throw Error(`${bazelWorkspacePath} bazelWorkspacePath does not exist`);
}

process.chdir(bazelWorkspacePath);

if (args[2] !== undefined) {
  const unboxConfigPath = args[2].replace('~', os.homedir);

  if (!fs.existsSync(unboxConfigPath)) {
    throw Error(`${unboxConfigPath} unbox config does not exist`);
  }

  const userConfigString = fs.readFileSync(unboxConfigPath, 'utf8');

  /** @type {Config} */
  const userConfig = JSON.parse(userConfigString);

  config = { ...config, ...userConfig };
}

const compDbString = fs.readFileSync(compileCommandsPath, 'utf8');

/** @type {CompDbEntry[]} */
const compDbIn = JSON.parse(compDbString);

/** @type {CompDbEntry[]} */
const compDbOut = [];

if (config.includePrefixPath == null) {
  compDbIn.forEach((compDbEntry) => {
    return compDbOut.push(unbox(compDbEntry, bazelWorkspacePath));
  });
} else {
  compDbIn.forEach((compDbEntry) => {
    if (
      compDbEntry.file.startsWith(
        /** @type {string} */ (config.includePrefixPath),
      )
    ) {
      compDbOut.push(unbox(compDbEntry, bazelWorkspacePath));
    }
  });
}

fs.writeFileSync(compileCommandsPath, JSON.stringify(compDbOut, null, 2));
