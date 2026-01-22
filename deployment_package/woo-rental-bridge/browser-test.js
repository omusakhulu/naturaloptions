const https = require('https');

const options = {
  hostname: 'omnishop.omnispace3d.com',
  port: 443,
  path: '/wp-json/wc/v3/system_status',
  method: 'GET',
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'dnt': '1',
    'pragma': 'no-cache',
    'priority': 'u=0, i',
    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
  }
};

console.log('Sending request to:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      console.log('Response:', JSON.parse(data));
    } catch (e) {
      console.log('Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
