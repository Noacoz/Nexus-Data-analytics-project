const { execFileSync } = require('child_process');

(async () => {
  try {
    const provResp = await fetch('http://localhost:4000/api/2fa/provision', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'demo-user' }),
    });
    const prov = await provResp.json();
    console.log('PROVISION:', JSON.stringify(prov, null, 2));

    const secret = prov.secret;
    const token = execFileSync(process.execPath, ['scripts/generate-totp.js', secret], { encoding: 'utf8' }).trim();
    console.log('TOKEN:', token);

    const verifyResp = await fetch('http://localhost:4000/api/2fa/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'demo-user', token }),
    });
    const verify = await verifyResp.json();
    console.log('VERIFY:', JSON.stringify(verify, null, 2));
  } catch (err) {
    console.error('ERROR:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
})();
