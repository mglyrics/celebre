import app from '../server.ts';

export default function handler(req: any, res: any) {
  // Normalize URL for Vercel Serverless Function rewrites (/api/index?path=...)
  if (req.query && req.query.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
    req.url = '/api/' + rawPath.replace(/^\/+/, '');
  } else if (req.url && (req.url.startsWith('/api/index') || req.url.startsWith('/index') || req.url.startsWith('/?path='))) {
    const match = req.url.match(/path=([^&]+)/);
    if (match) {
      req.url = '/api/' + decodeURIComponent(match[1]).replace(/^\/+/, '');
    }
  }
  return app(req, res);
}
