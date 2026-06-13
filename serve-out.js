import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const base = path.join(__dirname, 'out');

const mime = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml',
  '.ico':'image/x-icon'
};

const indexPath = path.join(base, 'index.html');

function sendFile(res, filePath){
  fs.readFile(filePath, (err, data)=>{
    if(err){ res.statusCode=404; res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    res.end(data);
  });
}

const server = http.createServer((req,res)=>{
  try{
    const url = new URL(req.url, `http://${req.headers.host}`);
    let reqPath = decodeURIComponent(url.pathname);

    // Prefer file if requested explicitly
    const filePath = path.join(base, reqPath);
    if(!filePath.startsWith(base)) { res.statusCode=403; res.end('Forbidden'); return; }

    fs.stat(filePath, (err, stats)=>{
      if(!err && stats.isFile()){
        return sendFile(res, filePath);
      }

      // If path looks like a static asset (has an extension), return 404
      if(path.extname(reqPath)){
        res.statusCode = 404; res.end('Not found'); return;
      }

      // SPA fallback — serve index.html for client-side routes
      fs.readFile(indexPath, (indexErr, indexData)=>{
        if(indexErr){ res.statusCode=500; res.end('Index not found'); return; }
        res.setHeader('Content-Type', mime['.html']);
        res.end(indexData);
      });
    });

  }catch(e){ console.error(e); res.statusCode=500; res.end('Server error'); }
});

server.listen(port, ()=> console.log(`Serving ${base} at http://localhost:${port}`));
