#!/usr/bin/env node
// Patches package.json to use local file path for @cerberus/shared
// Run from the package directory: node ../scripts/patch-shared.js
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies['@cerberus/shared'] = 'file:../shared';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
console.log('Patched @cerberus/shared to file:../shared');
