const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// pnpm stores packages in a virtual store and uses symlinks.
// Metro needs to follow those symlinks to resolve transitive deps
// like react-native-css-interop (a dep of nativewind).
config.resolver = {
  ...config.resolver,
  // Allow Metro to follow symlinks (required for pnpm)
  unstable_enableSymlinks: true,
  // Ensure node_modules at project root are searched
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
};

module.exports = withNativeWind(config, { input: './app/globals.css' });
