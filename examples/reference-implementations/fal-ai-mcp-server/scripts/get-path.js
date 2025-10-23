#!/usr/bin/env node

/**
 * Get Path Script
 * Outputs the absolute path to the compiled index.js for Claude Desktop configuration
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get absolute path to build/index.js
const indexPath = resolve(join(__dirname, '../build/index.js'));

console.log(indexPath);
