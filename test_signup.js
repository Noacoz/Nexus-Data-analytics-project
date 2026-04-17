const fetch = require('node-fetch');

async function signup() {
  try {
    const response = await fetch('http://localhost:5000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@nexus.ai',
        password: 'test123'
      })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('User:', data);
    console.log('Set-Cookie:', response.headers.raw()['set-cookie']);
  } catch (err) {
    console.error('Error:', err);
  }
}

signup();

