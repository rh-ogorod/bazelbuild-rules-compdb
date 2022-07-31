#!/usr/bin/env -S yarn node
// Hey Emacs, this is -*- coding: utf-8 -*-

/* eslint-disable prefer-regex-literals */

const process = require('node:process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { tokeniseCommand } = require('./lib');

// eslint-disable-next-line max-len
// command = "/usr/bin/gcc-11 -U_FORTIFY_SOURCE -fstack-protector -Wall -Wunused-but-set-parameter -Wno-free-nonheap-object -fno-omit-frame-pointer -std=c++0x -std=c++20 -fno-canonical-system-headers -Wno-builtin-macro-redefined -D__DATE__=\"redacted\" -D__TIMESTAMP__=\"redacted\" -D__TIME__=\"redacted\" -I bazel-out/k8-fastbuild/bin/external/flatbuffers/src/_virtual_includes/flatc -I bazel-out/k8-fastbuild/bin/external/flatbuffers/src/_virtual_includes/flatc_library -I bazel-out/k8-fastbuild/bin/external/flatbuffers/src/_virtual_includes/flatbuffers -I bazel-out/k8-fastbuild/bin/external/flatbuffers/grpc/src/compiler/_virtual_includes/cpp_generator -I bazel-out/k8-fastbuild/bin/external/flatbuffers/_virtual_includes/flatbuffers -I bazel-out/k8-fastbuild/bin/external/flatbuffers/grpc/src/compiler/_virtual_includes/go_generator -I bazel-out/k8-fastbuild/bin/external/flatbuffers/grpc/src/compiler/_virtual_includes/java_generator -I bazel-out/k8-fastbuild/bin/external/flatbuffers/grpc/src/compiler/_virtual_includes/python_generator -I bazel-out/k8-fastbuild/bin/external/flatbuffers/grpc/src/compiler/_virtual_includes/python_generator_private -I bazel-out/k8-fastbuild/bin/external/flatbuffers/grpc/src/compiler/_virtual_includes/swift_generator -I bazel-out/k8-fastbuild/bin/external/flatbuffers/grpc/src/compiler/_virtual_includes/ts_generator -iquote external/flatbuffers -iquote bazel-out/k8-fastbuild/bin/external/flatbuffers -x c++ -c external/flatbuffers/src/flatc_main.cpp"

// eslint-disable-next-line max-len
// command = "/usr/bin/gcc-11 -U_FORTIFY_SOURCE -fstack-protector -Wall -Wunused-but-set-parameter -Wno-free-nonheap-object -fno-omit-frame-pointer -std=c++0x -std=c++20 -Wno-builtin-macro-redefined -D__DATE__=\"redacted\" -D__TIMESTAMP__=\"redacted\" -D__TIME__=\"redacted\" -D BOOST_FUSION_DONT_USE_PREPROCESSED_FILES -D BOOST_MPL_CFG_NO_PREPROCESSED_HEADERS -D BOOST_MPL_LIMIT_VECTOR_SIZE=50 -D FUSION_MAX_VECTOR_SIZE=30 -D BOOST_BIND_GLOBAL_PLACEHOLDERS -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/wui/_virtual_includes/wui -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/cpp_utils/reflection/_virtual_includes/reflection -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/wtx/server/_virtual_includes/server -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/cpp_utils/debug/_virtual_includes/debug -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/cpp_utils/signal_processors/_virtual_includes/signal_processors -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/wtx/server/_virtual_includes/wtx_common -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/data_logger/_virtual_includes/data_logger -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/data_formaters/_virtual_includes/data_formaters -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/instrument_model/_virtual_includes/instrument_model -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/cpp_utils/inline/_virtual_includes/inline -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/modules_connection/_virtual_includes/modules_connection -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/persistence/_virtual_includes/persistence -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/system_logger/_virtual_includes/system_logger -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/utils/_virtual_includes/utils -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/config/_virtual_includes/config -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/physical_values/_virtual_includes/physical_values -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/wui_controller/_virtual_includes/wui_controller -I /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host/server/state_machine/_virtual_includes/state_machine -iquote /home/rh/box/cambustion/s600-solution-n/bazel-s600-solution-n/external/host -iquote /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/host -iquote /home/rh/box/cambustion/s600-solution-n/bazel-s600-solution-n/external/cpp_utils -iquote /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/cpp_utils -iquote /home/rh/box/cambustion/s600-solution-n/bazel-s600-solution-n/external/wtx -iquote /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/wtx -iquote /home/rh/box/cambustion/s600-solution-n/bazel-s600-solution-n/external/system -iquote /home/rh/box/cambustion/s600-solution-n/bazel-s600-solution-n/external/bazel_tools -isystem /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/wt/wt/include -isystem /home/rh/box/cambustion/s600-solution-n/bazel-out/k8-fastbuild/bin/external/boost/boost/include/boost-1_76 -x c++ -c /home/rh/box/cambustion/s600-solution-n/bazel-s600-solution-n/external/host/server/s600-host.cpp"

// eslint-disable-next-line max-len
// command =  "/usr/bin/g++-11 -DBOOST_ALL_NO_LIB -DBOOST_DATE_TIME_DYN_LINK -DBOOST_FILESYSTEM_DYN_LINK -DBOOST_RANDOM_DYN_LINK -DBOOST_REGEX_DYN_LINK -DBOOST_SPIRIT_THREADSAFE -DBOOST_SYSTEM_DYN_LINK -DBOOST_THREAD_DYN_LINK -DGLEW_STATIC -DHAVE_GRAPHICSMAGICK -DHAVE_PDF_IMAGE -DWT_BUILDING -DWT_FONTSUPPORT_SIMPLE -DWT_WITH_OLD_INTERNALPATH_API -D_REENTRANT -Dwt_EXPORTS -I/home/rh/.cache/bazel/_bazel_rh/7f2ec843b2bb9df2c5800cb918fd66bf/sandbox/linux-sandbox/2/execroot/s600-solution-2/bazel-out/k8-fastbuild/bin/external/wt/wt.build_tmpdir -I/home/rh/.cache/bazel/_bazel_rh/7f2ec843b2bb9df2c5800cb918fd66bf/sandbox/linux-sandbox/2/execroot/s600-solution-2/external/wt/src/src/web -I/home/rh/.cache/bazel/_bazel_rh/7f2ec843b2bb9df2c5800cb918fd66bf/sandbox/linux-sandbox/2/execroot/s600-solution-2/external/wt/src/src -I/home/rh/.cache/bazel/_bazel_rh/7f2ec843b2bb9df2c5800cb918fd66bf/sandbox/linux-sandbox/2/execroot/s600-solution-2/bazel-out/k8-fastbuild/bin/external/wt/wt.build_tmpdir/src -I/home/rh/.cache/bazel/_bazel_rh/7f2ec843b2bb9df2c5800cb918fd66bf/sandbox/linux-sandbox/2/execroot/s600-solution-2/external/wt/src/src/Wt/Dbo/backend/amalgamation -I/home/rh/.cache/bazel/_bazel_rh/7f2ec843b2bb9df2c5800cb918fd66bf/sandbox/linux-sandbox/2/execroot/s600-solution-2/external/wt/src/src/3rdparty/glew-1.10.0/include -I/usr/include/GraphicsMagick -isystem /home/rh/.cache/bazel/_bazel_rh/7f2ec843b2bb9df2c5800cb918fd66bf/sandbox/linux-sandbox/2/execroot/s600-solution-2/bazel-out/k8-fastbuild/bin/external/wt/wt.ext_build_deps/boost/include/boost-1_76 -pipe -feliminate-unused-debug-types -Wno-unused-parameter -std=c++20 -O2 -g -DNDEBUG -fPIC -o CMakeFiles/wt.dir/Wt/ServerSideFontMetrics.C.o -c /home/rh/.cache/bazel/_bazel_rh/7f2ec843b2bb9df2c5800cb918fd66bf/sandbox/linux-sandbox/2/execroot/s600-solution-2/external/wt/src/src/Wt/ServerSideFontMetrics.C"

// eslint-disable-next-line no-tabs, max-len
// command = "   	/usr/bin/gcc     -U_FORTIFY_SOURCE -fstack-protector -Wall -Wunused-but-set-parameter -Wno-free-nonheap-object -fno-omit-frame-pointer -std=c++0x -f\"no -canonical-system-headers\" -Wno-builtin-macro-redefined -D__DATE__=\"redacted\" -D__TIMESTAMP__=\"redacted\" -D__TIME__=\"redacted\" -I \"bazel- out/k8-fastbuild/bin/server/_virtual_includes/server\" -I'bazel-out/ k8-fastbuild/bin/external/wt/_virtual_includes/wt' -I bazel\\ -out/k8-fastbuild/bin/external/rh_cpp_utils/reflection/_virtual_includes/reflection -I bazel-out/k8-fastbuild/bin/external/rh_cpp_utils/debug/_virtual_includes/debug -iquote . -iquote bazel-out/k8-fastbuild/genfiles -iquote bazel-out/k8-fastbuild/bin -iquote external/wt -iquote bazel-out/k8-fastbuild/genfiles/external/wt -iquote bazel-out/k8-fastbuild/bin/external/wt -iquote external/system -iquote bazel-out/k8-fastbuild/genfiles/external/system -iquote bazel-out/k8-fastbuild/bin/external/system -iquote external/rh_cpp_utils -iquote bazel-out/k8-fastbuild/genfiles/external/rh_cpp_utils -iquote bazel-out/k8-fastbuild/bin/external/rh_cpp_utils -x c++ -c server/wtx/SimpleComboBox.cpp  /usr/bin/gcc ";

// eslint-disable-next-line max-len
// command = "/usr/bin/gcc -U_FORTIFY_SOURCE -fstack-protector -Wall -Wunused-but-set-parameter -Wno-free-nonheap-object -fno-omit-frame-pointer -std=c++0x -fno-canonical-system-headers -Wno-builtin-macro-redefined -D__DATE__=\"redacted\" -D__TIMESTAMP__=\"redacted\" -D__TIME__=\"redacted\" -I bazel-out/k8-fastbuild/bin/server/_virtual_includes/server -I bazel-out/k8-fastbuild/bin/external/wt/_virtual_includes/wt -I bazel-out/k8-fastbuild/bin/external/rh_cpp_utils/reflection/_virtual_includes/reflection -I bazel-out/k8-fastbuild/bin/external/rh_cpp_utils/debug/_virtual_includes/debug -iquote . -iquote bazel-out/k8-fastbuild/bin -iquote external/wt -iquote bazel-out/k8-fastbuild/bin/external/wt -iquote external/system -iquote bazel-out/k8-fastbuild/bin/external/system -iquote external/rh_cpp_utils -iquote bazel-out/k8-fastbuild/bin/external/rh_cpp_utils -x c++ -c server/wtx/SimpleComboBox.cpp"

// bazelWorkspacePath = "/home/rh/box/cambustion/s600-index"
// file = "external/flatbuffers/src/flatc_main.cpp"

// /** @type {{ type: string, path: string }[]} */
// const bazelAdditionalIncludes = [{
//   type: '-isystem',
//   path: 'bazel-out/k8-fastbuild/bin/external/' +
//     'wt/copy_wt/wt/wt.build_tmpdir',
// }];

// /** @type {Record<string, string>} */
// const bazelExternalReplacements = {
//   'boost/boost/include/boost-1_76': 'external/boost/src',
//   // As we are not cross-compiling, the host already has
//   // all requred access to system libs. So, excluding it.
//   system: '',
//   // Bazel tools lib is not used in this project.
//   bazel_tools: '',
// };

/**
 * @typedef {{
 *   bazelAdditionalIncludes: { type: string, path: string }[],
 *   bazelExternalReplacements: Record<string, string>,
 *   includePrefixPath: string | null,
 * }} Config
 */

/** @type {Config} */
let config = {
  bazelAdditionalIncludes: [],
  bazelExternalReplacements: {},
  includePrefixPath: null,
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
