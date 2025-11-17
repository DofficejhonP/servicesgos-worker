export default async function handler(req, res) {
  console.log('Request:', req.method, req.url);
  
  const servers = [
    'http://89.221.203.30:3000',
    'http://77.110.113.167:3000', 
    'http://81.90.31.165:3000',
    'http://45.151.62.107:3000'
  ];

  const server = servers[Math.floor(Math.random() * servers.length)];
  
  // ВСЕ ЗАПРОСЫ проксируем (включая CSS, JS, изображения)
  const targetUrl = `${server}${req.url}`;
  
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
        'X-Real-IP': req.headers['x-forwarded-for'] || '127.0.0.1',
        'Accept': req.headers['accept'] || '*/*',
        'Referer': req.headers['referer'],
        'Accept-Encoding': req.headers['accept-encoding']
      }
    });

    // Получаем контент
    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Для бинарных файлов используем arrayBuffer
    let data;
    if (contentType.includes('image/') || contentType.includes('application/') || contentType.includes('font/')) {
      const arrayBuffer = await response.arrayBuffer();
      data = Buffer.from(arrayBuffer);
    } else {
      data = await response.text();
    }

    return res.status(response.status)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Content-Type', contentType)
      .setHeader('Cache-Control', response.headers.get('cache-control') || 'public, max-age=0')
      .setHeader('X-Proxy-Server', server)
      .send(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(503)
      .setHeader('Access-Control-Allow-Origin', '*')
      .json({ 
        error: 'Proxy Error',
        message: error.message,
        url: targetUrl
      });
  }
}