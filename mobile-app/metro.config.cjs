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
  unstable_enableSymlinks: undefined,
  // Ensure node_modules at project root are searched
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
};

// ---------------------------------------------------------------------------
// Pin React resolution (pnpm monorepo fix for "Invalid hook call").
// The workspace is a pnpm monorepo whose ROOT package (Next.js SaaS) uses
// react@19.2.3 while THIS mobile app uses react@19.1.0. Both live in the same
// .pnpm virtual store. When Metro follows symlinks, some packages can resolve
// into the other React copy, bundling two Reacts -> "more than one copy of
// React" / "Invalid hook call" inside QueryClientProvider etc.
// Force every react import to the mobile app's own react instance.
// ---------------------------------------------------------------------------
const appNodeModules = path.resolve(__dirname, 'node_modules');
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName === 'react/jsx-runtime' ||
    moduleName === 'react/jsx-dev-runtime'
  ) {
    const subpath = moduleName === 'react' ? '' : moduleName.replace('react', '');
    const filePath = path.join(
      appNodeModules,
      'react',
      subpath ? `${subpath}.js` : 'index.js'
    );
    return { type: 'sourceFile', filePath };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './app/globals.css' });
