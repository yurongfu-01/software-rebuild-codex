#!/usr/bin/env node
import fs from 'node:fs/promises';
import { loadConfig } from '../src/config.mjs';
import { Service, TOOLS } from '../src/service.mjs';
import { serve } from '../src/server.mjs';
import { RebuildError } from '../src/errors.mjs';
import { redact } from '../src/scope.mjs';
import { configuredSecrets } from '../src/config.mjs';
import { exportProfiles } from '../src/harness.mjs';

async function argumentsFile(file) {
  if (!file) return {};
  if ((await fs.stat(file)).size > 300000) throw new RebuildError('INPUT', 'Arguments file too large');
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { throw new RebuildError('INPUT', 'Arguments file must contain valid JSON'); }
}

try {
  const command = process.argv[2] || 'help';
  if (command === 'help' || command === '--help') console.log(JSON.stringify({ usage: 'software-rebuild <tool> [arguments.json] | serve | harness_export request.json', tools: TOOLS.map(t => t.name), configuration: 'Set REBUILD_CONFIG to an absolute host-owned JSON configuration file.', harnessExport: 'Generate isolated host configuration and workflow files only; does not install or overwrite host settings.' }, null, 2));
  else if (command === 'harness_export') console.log(JSON.stringify(await exportProfiles(await argumentsFile(process.argv[3])), null, 2));
  else {
    const service = new Service(await loadConfig());
    try {
      if (command === 'serve') await serve(service);
      else {
        console.log(JSON.stringify(await service.dispatch(command, await argumentsFile(process.argv[3])), null, 2));
      }
    } finally { await service.close(); }
  }
} catch (e) {
  console.error(JSON.stringify({ code: e.code || 'INTERNAL', message: e instanceof RebuildError ? redact(e.message, configuredSecrets({})) : 'Request failed; check local configuration' })); process.exitCode = 1;
}
