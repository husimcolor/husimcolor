const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Fix for Vercel build: Metro tries to watch symlinked files inside node_modules
// which causes "Failed to get SHA-1" errors in Vercel's sandboxed environment.
config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: false,
  blockList: [
    // Block any file inside node_modules that Metro tries to watch via symlinks
    /node_modules\/.*\/node_modules\/.*/,
  ],
};

// Prevent Metro from watching node_modules symlinks
config.watchFolders = [__dirname];

module.exports = withNativeWind(config, {
  input: "./global.css",
  forceWriteFileSystem: true,
});
