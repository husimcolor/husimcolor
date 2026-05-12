const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Fix for Vercel build: Metro tries to watch symlinked node_modules files
// which don't exist in Vercel's build environment, causing SHA-1 errors.
// Disable symlink resolution to prevent this issue.
config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: false,
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
