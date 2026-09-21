const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const dataDirectory = path.join(root, 'data');
const enquiryFile = path.join(dataDirectory, 'enquiries.json');
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function saveEnquiry(enquiry) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const existing = fs.existsSync(enquiryFile) ? JSON.parse(fs.readFileSync(enquiryFile, 'utf8')) : [];
  existing.push(enquiry);
  fs.writeFileSync(enquiryFile, JSON.stringify(existing, null, 2));
}

function serveStatic(request, response) {
  const requestedPath = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = path.resolve(root, `.${requestedPath}`);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { ok: true, service: 'mutugi-interiors' });
    return;
  }

  if (request.method === 'POST' && request.url === '/api/enquiries') {
    try {
      const payload = JSON.parse(await readBody(request));
      const name = String(payload.name || '').trim();
      const email = String(payload.email || '').trim();
      const message = String(payload.message || '').trim();
      if (!name || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 120 || !message || message.length > 1200) {
        sendJson(response, 400, { error: 'Please provide a valid name, email, and project message.' });
        return;
      }
      const enquiry = { id: crypto.randomUUID(), name, email, message, createdAt: new Date().toISOString() };
      saveEnquiry(enquiry);
      sendJson(response, 201, { ok: true, id: enquiry.id });
    } catch (error) {
      sendJson(response, 400, { error: error.message === 'Unexpected end of JSON input' ? 'Please send valid enquiry details.' : 'Unable to save your enquiry.' });
    }
    return;
  }

  if (request.method === 'GET') {
    serveStatic(request, response);
    return;
  }

  sendJson(response, 405, { error: 'Method not allowed.' });
});

function startServer(currentPort, attempts = 0) {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempts < 10) {
      console.warn(`Port ${currentPort} is already in use. Trying ${currentPort + 1}...`);
      startServer(currentPort + 1, attempts + 1);
      return;
    }
    throw error;
  });

  server.listen(currentPort, () => {
    const address = server.address();
    const activePort = typeof address === 'object' && address ? address.port : currentPort;
    console.log(`Mutugi Interiors running at http://localhost:${activePort}`);
  });
}

startServer(port);
