export default async function handler(req, res) {
  const servers = [
    'http://89.221.203.30:3000',
    'http://77.110.113.167:3000', 
    'http://81.90.31.165:3000',
    'http://45.151.62.107:3000'
  ];
  
  const server = servers[Math.floor(Math.random() * servers.length)];
  const url = new URL(req.url, `https://${req.headers.host}`);
  const targetUrl = `${server}${url.pathname}${url.search}`;
  
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  }
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Vercel-Proxy',
        'X-Forwarded-For': req.headers['x-forwarded-for'] || req.ip
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? 
            JSON.stringify(req.body) : undefined
    });
    
    const data = await response.text();
    
    res.status(response.status)
       .setHeader('Access-Control-Allow-Origin', '*')
       .setHeader('Content-Type', response.headers.get('content-type') || 'text/html')
       .send(data);
    
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
}