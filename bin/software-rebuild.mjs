#!/usr/bin/env node
import fs from 'node:fs/promises';
import { loadConfig } from '../src/config.mjs';
import { Service, TOOLS } from '../src/service.mjs';
import { serve } from '../src/server.mjs';
import { RebuildError } from '../src/errors.mjs';
import { redact } from '../src/scope.mjs';
import { configuredSecrets } from '../src/config.mjs';

try {
  const command = process.argv[2] || 'help';
  if (command === 'help' || command === '--help') console.log(JSON.stringify({ usage: 'software-rebuild <tool> [arguments.json] | serve', tools: TOOLS.map(t => t.name), configuration: 'Set REBUILD_CONFIG to an absolute host-owned JSON configuration file.' }, null, 2));
  else {
    const service = new Service(await loadConfig());
    try {
      if (command === 'serve') await serve(service);
      else {
      let args = {};
      if (process.argv[3]) {
        if ((await fs.stat(process.argv[3])).size > 300000) throw Object.assign(new Error('INPUT: Arguments file too large'), { code: 'INPUT' });
        args = JSON.parse(await fs.readFile(process.argv[3], 'utf8'));
      }
      console.log(JSON.stringify(await service.dispatch(command, args), null, 2));
      }
    } finally { await service.close(); }
  }
} catch (e) {
  console.error(JSON.stringify({ code: e.code || 'INTERNAL', message: e instanceof RebuildError ? redact(e.message, configuredSecrets({})) : 'Request failed; check local configuration' })); process.exitCode = 1;
}
