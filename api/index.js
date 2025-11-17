export default async function handler(req, res) {
  const servers = [
    'http://89.221.203.30:3000',
    'http://77.110.113.167:3000', 
    'http://81.90.31.165:3000',
    'http://45.151.62.107:3000'
  ];

  const server = servers[Math.floor(Math.random() * servers.length)];
  const targetUrl = `${server}${req.url || '/'}`;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', '*')
      .end();
  }

  try {
    // В Node.js 18+ fetch встроенный, не нужен node-fetch
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Vercel-Proxy',
        'X-Forwarded-For': req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '127.0.0.1',
        'X-Real-IP': req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '127.0.0.1',
        'Accept': req.headers['accept'] || '*/*'
      },
      // Упрощаем body
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body ? 
            (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : 
            undefined
    });

    const data = await response.text();
    const contentType = response.headers.get('content-type') || 'text/html';

    // Устанавливаем заголовки ответа
    res.status(response.status)
       .setHeader('Access-Control-Allow-Origin', '*')
       .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
       .setHeader('Access-Control-Allow-Headers', '*')
       .setHeader('Content-Type', contentType)
       .setHeader('X-Served-By', 'Vercel-Proxy')
       .setHeader('X-Target-Server', server)
       .send(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(503)
       .setHeader('Access-Control-Allow-Origin', '*')
       .json({ 
         error: 'Proxy Error',
         message: error.message,
         server: server,
         url: targetUrl 
       });
  }
}