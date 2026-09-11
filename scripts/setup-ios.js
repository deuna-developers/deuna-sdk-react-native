#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const log = (msg) => console.log(`${GREEN}[deuna setup-ios]${RESET} ${msg}`);
const error = (msg) => { console.error(`${RED}[deuna setup-ios] ERROR:${RESET} ${msg}`); process.exit(1); };

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  error('Could not find package.json. Run from your React Native project root.');
}

function isExpoProject(root) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    return !!(pkg.dependencies?.expo || pkg.devDependencies?.expo);
  } catch { return false; }
}

function findIosDir(root) {
  const iosDir = path.join(root, 'ios');
  if (!fs.existsSync(iosDir)) error('ios/ directory not found. Run from your React Native project root.');
  return iosDir;
}

function main() {
  const root = findProjectRoot();
  log(`Project root: ${root}`);

  if (isExpoProject(root)) {
    log('Expo project detected — no manual setup needed.');
    log('Run: npx expo prebuild && npx expo run:ios');
    process.exit(0);
  }

  log('React Native CLI project detected.');
  log('@deuna/react-native-sdk uses React Native autolinking — no Podfile changes needed.\n');

  const iosDir = findIosDir(root);

  log('Running pod install...');
  try {
    execSync('pod install', {
      cwd: iosDir,
      stdio: 'inherit',
      env: { ...process.env, LANG: 'en_US.UTF-8' },
    });
  } catch {
    error('pod install failed. Check the output above for details.');
  }

  console.log(`\n${GREEN}✓ iOS setup complete!${RESET}`);
  console.log(`\nNext steps:`);
  console.log(`  npx react-native run-ios`);
}

main();
