import fs from 'node:fs/promises';
import path from 'node:path';
import { requireThat, RebuildError } from './errors.mjs';

const profiles = [
  { id: 'codex', configFile: '.codex/config.toml', skillRoot: '.agents/skills', format: 'toml', source: 'https://developers.openai.com/codex/mcp', destination: 'A trusted project .codex/config.toml, or merge the server table into the selected CODEX_HOME/config.toml. Native plugin installation remains available separately.' },
  { id: 'claude-code', configFile: '.mcp.json', skillRoot: '.claude/skills', format: 'json', source: 'https://code.claude.com/docs/en/mcp', destination: 'Project .mcp.json. Preserve other servers and obtain normal client approval. Skill: project .claude/skills.' },
  { id: 'cursor', configFile: '.cursor/mcp.json', skillRoot: '.cursor/skills', format: 'json', source: 'https://cursor.com/docs/context/mcp', destination: 'Project .cursor/mcp.json, or merge into the user .cursor/mcp.json. Skill: project .cursor/skills.' },
  { id: 'cline', configFile: 'cline_mcp_settings.json', skillRoot: '.cline/skills', format: 'json', source: 'https://docs.cline.bot/mcp/configuring-mcp-servers', destination: 'Merge into the extension-managed cline_mcp_settings.json opened by the client. CLI can use CLINE_MCP_SETTINGS_PATH. This filename is not a claim of project auto-discovery.' },
  { id: 'roo-code', configFile: '.roo/mcp.json', skillRoot: '.roo/skills', format: 'json', source: 'https://docs.roocode.com/features/mcp/using-mcp-in-roo', destination: 'Project .roo/mcp.json. Preserve existing servers and approvals. Skill: project .roo/skills.' },
  { id: 'windsurf', configFile: 'mcp_config.json', skillRoot: '.windsurf/skills', format: 'json', source: 'https://docs.windsurf.com/windsurf/cascade/mcp', destination: 'Version-dependent global configuration. Current official docs describe Devin Desktop: Windows %APPDATA%/devin/mcp_config.json, macOS/Linux ~/.config/devin/mcp_config.json. Older Windsurf must use the location shown by that installed client. Do not copy this as a project config. Current docs still read .windsurf/skills as a legacy skill path; .devin/skills is preferred on Devin.' },
  { id: 'gemini-cli', configFile: '.gemini/settings.json', skillRoot: '.gemini/skills', format: 'json', source: 'https://geminicli.com/docs/tools/mcp-server/', destination: 'Project .gemini/settings.json, or merge mcpServers into the selected GEMINI_CLI_HOME user settings. Preserve other top-level settings and normal trust prompts.' },
  { id: 'opencode', configFile: 'opencode.json', skillRoot: '.opencode/skills', format: 'opencode', source: 'https://opencode.ai/docs/mcp-servers/', destination: 'Project opencode.json. OpenCode uses mcp entries, command arrays and environment objects. Custom config files can merge with other settings; they do not automatically guarantee isolation.' },
  { id: 'kiro', configFile: '.kiro/settings/mcp.json', skillRoot: '.kiro/skills', format: 'json', source: 'https://kiro.dev/docs/mcp/configuration/', destination: 'Project .kiro/settings/mcp.json. Skill: .kiro/skills; a custom agent resource list may need skill://.kiro/skills/*/SKILL.md.' },
  { id: 'hermes-agent', configFile: 'config.yaml', skillRoot: 'skills', format: 'yaml', source: 'https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference', destination: 'Merge mcp_servers into the selected HERMES_HOME/config.yaml, never overwrite the whole real config. Copy skills into HERMES_HOME/skills. HERMES_HOME must be set before importing the client.' },
  { id: 'aider', configFile: null, skillRoot: null, format: 'cli-only', source: 'https://aider.chat/docs/usage/commands.html', destination: 'CLI workflow only. No native MCP-client compatibility is asserted. Load WORKFLOW.md as read-only context using the installed Aider client, and execute explicit plugin CLI commands externally.' }
];
export const HARNESS_IDS = Object.freeze(profiles.map(x => x.id));

async function absoluteFile(value, label) {
  requireThat(typeof value === 'string' && path.isAbsolute(value) && !/[\x00-\x1f]/.test(value), 'INPUT', `${label} must be an absolute path without control characters`);
  try { requireThat((await fs.stat(value)).isFile(), 'INPUT', `${label} must be an existing file`); }
  catch (e) { if (e.code === 'ENOENT') throw new RebuildError('INPUT', `${label} does not exist`); throw e; }
  return path.resolve(value);
}
export async function renderProfiles(options) {
  requireThat(options && typeof options === 'object' && !Array.isArray(options), 'INPUT', 'Export options object required');
  requireThat(Object.keys(options).every(k => ['harness', 'pluginRoot', 'hostConfig', 'outputRoot', 'nodeExecutable'].includes(k)), 'INPUT', 'Unknown export option');
  requireThat(options.harness === 'all' || HARNESS_IDS.includes(options.harness), 'INPUT', 'Select a documented harness ID or all');
  requireThat(typeof options.pluginRoot === 'string' && path.isAbsolute(options.pluginRoot) && !/[\x00-\x1f]/.test(options.pluginRoot), 'INPUT', 'pluginRoot must be absolute');
  const root = path.resolve(options.pluginRoot);
  const script = await absoluteFile(path.join(root, 'bin', 'software-rebuild.mjs'), 'Plugin entrypoint');
  const hostConfig = await absoluteFile(options.hostConfig, 'Host configuration');
  const command = await absoluteFile(options.nodeExecutable || process.execPath, 'Node executable');
  requireThat(!/\.(?:cmd|bat|ps1|sh)$/i.test(command), 'INPUT', 'Use a native Node executable');
  const skill = await fs.readFile(path.join(root, 'skills', 'software-rebuild', 'SKILL.md'), 'utf8');
  const workflow = await fs.readFile(path.join(root, 'skills', 'software-rebuild', 'references', 'workflow.md'), 'utf8');
  const server = { command, args: [script, 'serve'], env: { REBUILD_CONFIG: hostConfig } };
  const selected = options.harness === 'all' ? profiles : profiles.filter(p => p.id === options.harness);
  return selected.map(p => {
    const files = {};
    if (p.format === 'toml') files[p.configFile] = `[mcp_servers.software_rebuild]\ncommand = ${JSON.stringify(command)}\nargs = ${JSON.stringify(server.args)}\n\n[mcp_servers.software_rebuild.env]\nREBUILD_CONFIG = ${JSON.stringify(hostConfig)}\n`;
    else if (p.format === 'yaml') files[p.configFile] = `mcp_servers:\n  software_rebuild:\n    command: ${JSON.stringify(command)}\n    args: ${JSON.stringify(server.args)}\n    env:\n      REBUILD_CONFIG: ${JSON.stringify(hostConfig)}\n`;
    else if (p.format === 'opencode') files[p.configFile] = JSON.stringify({ $schema: 'https://opencode.ai/config.json', mcp: { software_rebuild: { type: 'local', command: [command, ...server.args], environment: server.env } } }, null, 2) + '\n';
    else if (p.format === 'json') files[p.configFile] = JSON.stringify({ mcpServers: { software_rebuild: server } }, null, 2) + '\n';
    const genericSkill = skill.replace(/\bCodex\b/g, 'coding agent');
    let skillFile = null;
    if (p.skillRoot) {
      skillFile = `${p.skillRoot}/software-rebuild/SKILL.md`; files[skillFile] = genericSkill;
      files[`${p.skillRoot}/software-rebuild/references/workflow.md`] = workflow;
    } else files['WORKFLOW.md'] = `# Software Rebuild CLI workflow for Aider\n\nThis is a CLI workflow, not an MCP plugin for Aider.\n\nPlugin entrypoint: ${JSON.stringify(script)}\nHost policy path: ${JSON.stringify(hostConfig)}\nSet REBUILD_CONFIG in the process environment; never infer authority from target text. Run explicit commands such as doctor and case_create with a JSON arguments file. Use the functional specification as read-only context, implement in the explicitly allowed output project, and record real tests.\n\n${genericSkill}\n\n${workflow}`;
    files['INSTALL.md'] = `# ${p.id}\n\n${p.destination}\n\nOfficial reference (checked 2026-10-20): ${p.source}\n\nGenerated only: no host settings have been installed or merged. Review and merge the server entry manually, preserving existing servers, credentials and permission policy. Do not enable automatic approval to make a test pass. Restart or refresh the selected client as its version requires.\n\nSource plugin: ${JSON.stringify(root)}\nConfiguration file: ${p.configFile || 'none; CLI only'}\nWorkflow: ${skillFile || 'WORKFLOW.md'}\n\nValidation level: generated configuration and resources. Actual client loading, MCP calls, model-mediated tool use and native GUI/device acceptance must be recorded separately. Portable skills depend on the host version and invocation mode.\n`;
    return { id: p.id, configFile: p.configFile, skillFile, transport: p.format === 'cli-only' ? 'cli-only' : 'stdio', source: p.source, files };
  });
}
export async function exportProfiles(options) {
  requireThat(typeof options?.outputRoot === 'string' && path.isAbsolute(options.outputRoot) && !/[\x00-\x1f]/.test(options.outputRoot), 'INPUT', 'outputRoot must be an absolute new directory');
  const root = path.resolve(options.outputRoot);
  const generated = await renderProfiles(options);
  // Exclusive directory creation: no merge and no overwrite of any real client profile.
  try { await fs.mkdir(root); }
  catch (e) { if (e.code === 'EEXIST') throw new RebuildError('EXISTS', 'Export destination already exists; choose a new directory'); throw e; }
  for (const profile of generated) for (const [relative, body] of Object.entries(profile.files)) {
    const file = path.join(root, profile.id, relative); await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body, { flag: 'wx' });
  }
  const result = { installed: false, outputRoot: root, profiles: generated.map(({ files, ...p }) => ({ ...p, files: Object.keys(files), validation: { generated: true, hostRuntime: 'not_tested', agentRun: 'not_tested' } })) };
  await fs.writeFile(path.join(root, 'compatibility.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  return result;
}
