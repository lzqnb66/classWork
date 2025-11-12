const http = require('http');

// 测试趋势API
const options = {
  hostname: 'localhost',
  port: 3789,
  path: '/api/steps/stats/trend?days=7',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your_token_here',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('API Response:', JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();