import app from '../server.ts';

export default function handler(req: any, res: any) {
  // Normalize URL for Vercel Serverless Function rewrites (/api/index?path=...)
  if (req.query && req.query.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(req.query)) {
      if (key !== 'path') {
        if (Array.isArray(val)) {
          val.forEach((v) => params.append(key, String(v)));
        } else if (val !== undefined && val !== null) {
          params.append(key, String(val));
        }
      }
    }
    const queryString = params.toString();
    req.url = '/api/' + rawPath.replace(/^\/+/, '') + (queryString ? `?${queryString}` : '');
  } else if (req.url && (req.url.startsWith('/api/index') || req.url.startsWith('/index') || req.url.startsWith('/?path='))) {
    const match = req.url.match(/path=([^&]+)/);
    if (match) {
      const remainingQuery = req.url.includes('&') ? '?' + req.url.split('&').slice(1).join('&') : '';
      req.url = '/api/' + decodeURIComponent(match[1]).replace(/^\/+/, '') + remainingQuery;
    }
  }
  return app(req, res);
}
