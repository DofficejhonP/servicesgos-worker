export default async function handler(req, res) {
  console.log('🔥 CATCH-ALL Request:', req.method, req.url, req.query);
  
  const servers = [
    'http://89.221.203.30:3000',
    'http://77.110.113.167:3000', 
    'http://81.90.31.165:3000',
    'http://45.151.62.107:3000'
  ];

  const server = servers[Math.floor(Math.random() * servers.length)];
  
  // Строим путь из query параметров или используем req.url
  let path = '/';
  if (req.query.slug && Array.isArray(req.query.slug)) {
    path = '/' + req.query.slug.join('/');
  } else if (req.url && req.url !== '/api') {
    path = req.url;
  }
  
  const targetUrl = `${server}${path}`;
  console.log('🎯 Proxying to:', targetUrl);

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Vercel-Proxy'
      }
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Для изображений и бинарных файлов
    if (contentType.startsWith('image/') || 
        contentType.includes('application/octet-stream') ||
        contentType.includes('font/')) {
      const buffer = await response.arrayBuffer();
      return res.status(response.status)
        .setHeader('Content-Type', contentType)
        .setHeader('Cache-Control', 'public, max-age=86400')
        .send(Buffer.from(buffer));
    }
    
    // Для всех остальных
    const data = await response.text();
    return res.status(response.status)
      .setHeader('Content-Type', contentType)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('X-Proxy-Server', server)
      .send(data);

  } catch (error) {
    console.error('💥 Proxy error:', error);
    return res.status(503).json({ 
      error: error.message, 
      url: targetUrl, 
      path: path 
    });
  }
}