# Platform workflow

All platforms use case_create → case_advance(scoped) → route → case_advance(routed, route artifact) → analysis evidence → analyzed → specification evidence → specified → implementation evidence → rebuilt → verification evidence → verified.

The route artifact has `{ "platform": "android", "method": "reverse-skill-upstream" }` (or the actual returned method). Later artifacts contain `{ "evidenceIds": ["UUID"] }`.

## Desktop

Confirm target file and permitted runtime actions. Identify executable format and architecture before choosing native, .NET or Electron analysis. Start with static evidence; attach/run/modify only where authorized. Compare observable input/output in an actual desktop runtime when available. A Node sample does not establish native GUI fidelity.

## Web

Confirm allowed origins and interactions. Use the authorized browser tooling to collect UI states, script/network evidence and error behavior. Do not follow cross-origin redirects or fetch new hosts outside the scope. Implement from the functional specification. Verify actual browser behavior, not only HTML presence or a mocked request.

## Android

Confirm APK origin, analysis rights and permitted emulator/device. Use JADX/APK tooling for static evidence; check adb and the device before runtime work. Test normal/error flows on the intended Android runtime. Java or JavaScript behavioral samples do not establish APK installation or device operation.

## Verification evidence

Use kind `verification`, classification `fact`, and content containing JSON:

```json
{"mode":"reported","checks":[{"name":"trim surrounding whitespace","status":"passed","expected":"hello","actual":"hello"}]}
```

Supply the actual test command, runtime, version and log location in source/content. Failed or unrun checks cannot advance to `verified`. Each item remains operator-supplied; present that provenance in delivery.

Each verification evidence item accepts 1-100 checks. Split larger runs into separate evidence items and include all their IDs in the `verified` transition. The report aggregates the checks referenced by that transition and keeps the full original evidence records.
