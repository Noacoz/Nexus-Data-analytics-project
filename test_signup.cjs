const fetch = (await import('node-fetch')).default;

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
    console.log('Response:', data);
    console.log('Headers set-cookie:', response.headers.raw()['set-cookie'] || 'No cookie');
  } catch (err) {
    console.error('Error:', err);
  }
}

signup();

