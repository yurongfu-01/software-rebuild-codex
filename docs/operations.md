# Operations and recovery

Run locally with Node.js >=22.12 and a private host-owned configuration. Each upstream installation, its credentials and optional native tools are maintained separately. No daemon, scheduled monitoring, cloud service or paid model is provisioned by this plugin.

## Storage and process ownership

Case storage belongs to the local operator. Keep it outside version control and protect it with filesystem permissions. `case.json`, `scope.json`, `events.jsonl` and `evidence/*.json` are not a database or an adversarially signed audit log. Evidence hashes detect changes inconsistent with metadata; they cannot protect against someone replacing the complete store. The configured root can resolve through an operator-owned link; links inside individual cases are rejected.

Mutations and reports acquire a per-case atomic directory lock. A live competing writer waits up to five seconds then receives BUSY. After a crash, `.lock/owner.json` identifies the PID and timestamp. Verify that process is gone and no other writer uses the case before manually removing only that stale lock. Never auto-delete an apparently stale lock on a guessed timeout.

Finalized (`verified`) cases reject new evidence so a new observation cannot silently inherit an old passed report. Start a new case for another run and retain the earlier case for comparison.

State replacement is atomic, while journal/evidence writes are not a multi-file database transaction. A crash can leave an orphan evidence file or journal entry. Preserve those records, compare against `case.json`, and recover in a copy with operator review; do not promote unmatched evidence into a passed stage automatically. No automated crash recovery is claimed.

Windows execution requires Windows PowerShell and the ability to compile the fixed Job Object helper. Targets start suspended and are assigned to the job before running. If this setup fails, execution fails closed. Normal exit or timeout closes the job and terminates remaining descendants. This lifecycle mechanism is not a hostile-code sandbox. POSIX cleanup kills the spawned process group; intentionally creating another session can escape it.

REA MCP sessions are process-local, case-scoped, capped at eight and idle-closed after 60 seconds. Closing a client does not undo actions already performed by an upstream tool. On timeout, treat completion as uncertain and reconcile actual target state before retrying. Restarting the plugin or using the CLI resets REA's in-memory target/session state.

## Configuration and secrets

`REBUILD_CONFIG` is an absolute path read at startup. Reloading requires a restart; grants edited while the server runs do not take effect immediately. Keep token values in environment variables, never configuration examples or case content. Known secret patterns and secret environment values are redacted from reports; this is defense in depth, not permission to put secrets into artifacts. Raw upstream stderr is not returned by tool errors.

PentAGI requests use a fixed host-configured HTTPS origin. Custom CA files are supported; disabling TLS verification is not. Flow metadata can contain confidential information. No redirects are followed and no task creation is retried or exposed.

## Publication and maintenance

The operator owns upgrades and deployment decisions. Pin and inspect upstream changes before updating contracts. Re-run tests and real probes after changes. Keep samples, real cases, logs and tokens outside published source; check the entire intended history before first push. Public copies cannot be recalled by deleting the repository later.

GitHub source publication does not deploy PentAGI, install a Codex account plugin or submit to the OpenAI directory. No continuous operations begin when the chat ends. Report these states separately.
