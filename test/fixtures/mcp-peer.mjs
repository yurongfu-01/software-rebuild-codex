import readline from 'node:readline';
const mode = process.argv[2];
let selected = null;
const rl = readline.createInterface({ input: process.stdin });
for await (const line of rl) {
  const req = JSON.parse(line); if (req.id === undefined) continue;
  if (mode === 'null') { process.stdout.write('null\n'); continue; }
  if (mode === 'no-result') { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id }) + '\n'); continue; }
  if (mode === 'hang') continue;
  if (mode === 'exit') process.exit(3);
  if (mode === 'oversize') { process.stdout.write('x'.repeat(5000)); continue; }
  let result;
  if (req.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'test-peer', version: '1.0' } };
  else if (req.method === 'tools/list') result = { tools: [{ name: 'inspect_fixture', description: 'Fixture only', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } }] };
  else if (req.method === 'tools/call') {
    if (req.params.arguments?.set) selected = req.params.arguments.set;
    result = { content: [{ type: 'text', text: JSON.stringify({ ...req.params, selected }) }] };
  }
  else { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'Not found' } }) + '\n'); continue; }
  const output = JSON.stringify({ jsonrpc: '2.0', id: req.id, result }) + '\n';
  if (mode === 'fragment') { process.stdout.write(output.slice(0, 12)); await new Promise(r => setTimeout(r, 5)); process.stdout.write(output.slice(12)); }
  else process.stdout.write(output);
}
