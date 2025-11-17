export default async function handler(req, res) {
  console.log('Request:', req.method, req.url);
  
  const servers = [
    'http://89.221.203.30:3000',
    'http://77.110.113.167:3000', 
    'http://81.90.31.165:3000',
    'http://45.151.62.107:3000'
  ];

  const server = servers[Math.floor(Math.random() * servers.length)];
  
  // Восстанавливаем оригинальный путь (убираем /api)
  let originalPath = req.url;
  if (req.url.startsWith('/api/')) {
    originalPath = req.url.replace('/api', '');
  }
  if (!originalPath || originalPath === '/') {
    originalPath = '/';
  }
  
  const targetUrl = `${server}${originalPath}`;
  console.log('Proxying to:', targetUrl);

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
        'X-Forwarded-For': req.headers['x-forwarded-for'] || '127.0.0.1',
        'Accept': req.headers['accept'] || '*/*'
      }
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Для бинарных файлов
    if (contentType.includes('image/') || contentType.includes('font/') || contentType.includes('application/octet-stream')) {
      const buffer = await response.arrayBuffer();
      return res.status(response.status)
        .setHeader('Content-Type', contentType)
        .setHeader('Cache-Control', 'public, max-age=86400')
        .send(Buffer.from(buffer));
    }
    
    // Для текстовых файлов
    const data = await response.text();
    return res.status(response.status)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Content-Type', contentType)
      .setHeader('X-Proxy-Server', server)
      .send(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(503)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ error: error.message, url: targetUrl });
  }
}