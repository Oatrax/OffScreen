// Windows only: keeps the app's CMake/ninja build under the 260-character MAX_PATH limit
// (React Native codegen paths are very long).
//  1. Moves the CMake staging directory to C:/b.
//  2. Makes CMake hash over-long object file names (CMAKE_OBJECT_PATH_MAX).
const { withAppBuildGradle } = require('expo/config-plugins');

const DIR_MARKER = '// short-cmake-dir';
const OBJ_MARKER = '// short-object-paths';

module.exports = function withShortCmakeDir(config) {
  if (process.platform !== 'win32') return config;
  return withAppBuildGradle(config, (c) => {
    let s = c.modResults.contents;
    if (!s.includes(DIR_MARKER)) {
      s = s.replace(
        /^android\s*\{/m,
        `android {\n    ${DIR_MARKER}\n    externalNativeBuild {\n        cmake {\n            buildStagingDirectory = file("C:/b")\n        }\n    }`,
      );
    }
    if (!s.includes(OBJ_MARKER)) {
      s = s.replace(
        /^(\s*)defaultConfig\s*\{/m,
        (m, indent) =>
          `${m}\n${indent}    ${OBJ_MARKER}\n${indent}    externalNativeBuild {\n${indent}        cmake {\n${indent}            arguments "-DCMAKE_OBJECT_PATH_MAX=120"\n${indent}        }\n${indent}    }`,
      );
    }
    c.modResults.contents = s;
    return c;
  });
};
