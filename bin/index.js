#!/usr/bin/env node
import('../dist/index.js').catch(err => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
