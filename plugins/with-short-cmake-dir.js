// Windows only: moves the app's CMake build folder to a short path so ninja stays under the
// 260-character MAX_PATH limit (React Native codegen paths are very long).
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// short-cmake-dir';

module.exports = function withShortCmakeDir(config) {
  if (process.platform !== 'win32') return config;
  return withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes(MARKER)) {
      c.modResults.contents = c.modResults.contents.replace(
        /^android\s*\{/m,
        `android {\n    ${MARKER}\n    externalNativeBuild {\n        cmake {\n            buildStagingDirectory = file("C:/b")\n        }\n    }`,
      );
    }
    return c;
  });
};
