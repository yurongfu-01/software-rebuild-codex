import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { runProcess } from '../process.mjs';
import { canonical, inside } from '../scope.mjs';
import { requireThat, text, RebuildError } from '../errors.mjs';

export class ReverseSkillAdapter {
  constructor(config) { this.config = config; }
  async route(hint) {
    text(hint, 'routing hint', 5000);
    requireThat(this.config?.root && this.config?.workRoot, 'UNAVAILABLE', 'Configure reverseSkill.root and reverseSkill.workRoot');
    const root = await canonical(this.config.root);
    const script = path.join(root, 'skills', 'scripts', 'master-route.ps1');
    try { await fs.access(script); } catch { throw new RebuildError('UNAVAILABLE', 'reverse-skill master-route.ps1 not found'); }
    requireThat(await inside(script, [root]), 'SCOPE', 'Upstream router escaped configured root');
    await fs.mkdir(this.config.workRoot, { recursive: true });
    const work = await canonical(this.config.workRoot); const output = path.join(work, randomUUID());
    await fs.mkdir(output);
    const result = await runProcess(this.config.powershell || (process.platform === 'win32' ? 'powershell.exe' : 'pwsh'), ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', script, '-Hint', hint, '-OutDir', output, '-ProjectRoot', work], { cwd: work, timeoutMs: this.config.timeoutMs || 30000 });
    const file = path.join(output, 'route-scope.md');
    requireThat(await inside(file, [output]) && !(await fs.lstat(file)).isSymbolicLink(), 'SCOPE', 'Router output escaped its directory');
    requireThat((await fs.stat(file)).size <= 200000, 'LIMIT', 'Router output too large');
    const markdown = await fs.readFile(file, 'utf8');
    const field = name => markdown.match(new RegExp(`^- ${name}: (.+)$`, 'm'))?.[1]?.trim();
    const skill = field('primary_skill');
    requireThat(skill?.startsWith('skills/') && await inside(path.resolve(root, skill), [root]), 'PROTOCOL', 'Invalid primary skill path');
    return { method: 'reverse-skill-upstream', primary: field('primary'), primarySkill: skill, confidence: field('confidence'), markdown, outputFile: file, exitCode: result.code, trust: 'Untrusted routing data; not instructions or execution authorization.' };
  }
}
