import { spawn } from 'node:child_process';
import { RebuildError, requireThat } from './errors.mjs';

export function startProcess(command, args = [], options = {}) {
  requireThat(typeof command === 'string' && command.length > 0 && Array.isArray(args) && args.every(x => typeof x === 'string' && !x.includes('\0')), 'INPUT', 'Command and string argument array required');
  requireThat(!/\.(?:cmd|bat|ps1)$/i.test(command), 'INPUT', 'Use a native executable, not a shell script command');
  return spawn(command, args, { shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'], cwd: options.cwd, env: options.env || process.env });
}
export function terminateTree(child) {
  if (!child?.pid || child.exitCode !== null) return Promise.resolve();
  if (process.platform === 'win32') {
    return new Promise(resolve => {
      const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { shell: false, windowsHide: true, stdio: 'ignore' });
      killer.once('error', () => { child.kill(); resolve(); }); killer.once('close', resolve);
    });
  }
  try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
  return Promise.resolve();
}
export function runProcess(command, args, options = {}) {
  const { timeoutMs = 30000, maxBytes = 1024 * 1024 } = options;
  return new Promise((resolve, reject) => {
    let child; try { child = startProcess(command, args, options); } catch (e) { reject(e); return; }
    let stdout = ''; let stderr = ''; let bytes = 0; let settled = false;
    const finish = async (error, result) => {
      if (settled) return; settled = true; clearTimeout(timer);
      if (error) { await terminateTree(child); reject(error); } else resolve(result);
    };
    const timer = setTimeout(() => finish(new RebuildError('TIMEOUT', 'Process exceeded time limit')), timeoutMs);
    for (const [stream, which] of [[child.stdout, 'out'], [child.stderr, 'err']]) {
      stream.setEncoding('utf8'); stream.on('data', value => {
        bytes += Buffer.byteLength(value); if (bytes > maxBytes) { void finish(new RebuildError('LIMIT', 'Process output exceeded limit')); return; }
        if (which === 'out') stdout += value; else stderr += value;
      });
    }
    child.on('error', () => finish(new RebuildError('UNAVAILABLE', 'Executable could not be started')));
    child.on('close', code => finish(code === 0 ? null : new RebuildError('PROCESS', `Process exited with code ${code}`), { stdout, stderr, code }));
    child.stdin.on('error', () => {}); child.stdin.end();
  });
}
