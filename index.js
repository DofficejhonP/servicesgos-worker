module.exports = async (req, res) => {
  const server = 'http://89.221.203.30:3000';
  const targetUrl = server + req.url;
  
  console.log('Proxy to:', targetUrl);
  
  try {
    const response = await fetch(targetUrl);
    const data = await response.text();
    const contentType = response.headers.get('content-type') || 'text/html';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).send(data);
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
};