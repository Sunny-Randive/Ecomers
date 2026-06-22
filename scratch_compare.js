async function main() {
  const urlRegister = 'http://34.47.52.111:8080/api/v1/auth/register';
  const urlLogin = 'http://34.47.52.111:8080/api/v1/auth/login';

  const userCreds = {
    username: 'testuser' + Math.floor(Math.random() * 10000),
    email: 'testuser' + Math.floor(Math.random() * 10000) + '@gmail.com',
    password: 'password',
    roles: ['ROLE_USER']
  };

  try {
    console.log('Registering user:', userCreds.username);
    const regRes = await fetch(urlRegister, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userCreds)
    });
    const regData = await regRes.text();
    console.log('Reg response status:', regRes.status, regData);

    console.log('Logging in...');
    const loginRes = await fetch(urlLogin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userCreds.username,
        password: userCreds.password
      })
    });
    const loginData = await loginRes.json();
    console.log('Login response status:', loginRes.status);

    if (loginData.token) {
      const token = loginData.token;
      console.log('Token received:', token);

      const parts = token.split('.');
      console.log('Token parts count:', parts.length);
      if (parts.length === 3) {
        const header = Buffer.from(parts[0], 'base64').toString('utf8');
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        console.log('Decoded Header:', header);
        console.log('Decoded Payload:', payload);
      }
    } else {
      console.log('No token in response:', loginData);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
