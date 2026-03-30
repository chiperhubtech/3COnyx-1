const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Block Metro from watching AWS SDK smithy temp directories and any _tmp_ paths.
// These temp dirs are created during package compilation then deleted, causing
// Metro's FallbackWatcher to crash with ENOENT. Safe to exclude globally.
config.resolver.blockList = [
  /.*_tmp_\d+.*/,
  /.*dist-types\/ts3\.4.*/,
  /.*\.cache.*/,
];

// Ensure workspace-level node_modules are watched (monorepo setup)
config.watchFolders = [
  path.resolve(__dirname, "../../node_modules"),
  path.resolve(__dirname, "../../lib"),
];

module.exports = config;
