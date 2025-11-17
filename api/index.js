export default async function handler(req, res) {
  console.log('API called:', req.method, req.url);
  
  const servers = [
    'http://89.221.203.30:3000',
    'http://77.110.113.167:3000', 
    'http://81.90.31.165:3000',
    'http://45.151.62.107:3000'
  ];

  const server = servers[Math.floor(Math.random() * servers.length)];
  
  // Убираем /api из пути для проксирования
  const path = req.url === '/api' ? '/' : req.url.replace('/api', '');
  const targetUrl = `${server}${path}`;
  
  console.log('Target URL:', targetUrl);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', '*')
      .end();
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Vercel-Proxy',
        'X-Forwarded-For': req.headers['x-real-ip'] || '127.0.0.1',
        'X-Real-IP': req.headers['x-real-ip'] || '127.0.0.1',
        'Accept': req.headers['accept'] || '*/*',
        'Host': new URL(targetUrl).host
      }
    });

    const data = await response.text();
    const contentType = response.headers.get('content-type') || 'text/html';

    return res.status(response.status)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Content-Type', contentType)
      .setHeader('X-Proxy-Server', server)
      .setHeader('X-Served-By', 'Vercel-Proxy')
      .send(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(503)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ 
        error: 'Proxy Error',
        message: error.message,
        server: server,
        targetUrl: targetUrl,
        timestamp: new Date().toISOString()
      });
  }
}