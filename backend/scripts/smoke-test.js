const http = require('http');

function smoke() {
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: '/',
    method: 'GET',
    timeout: 5000,
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.on('data', () => {});
    res.on('end', () => process.exit(res.statusCode === 200 ? 0 : 2));
  });

  req.on('error', (err) => {
    console.error('Smoke test failed:', err.message);
    process.exit(2);
  });

  req.end();
}

smoke();
