import app from '../server.ts';

export default function handler(req: any, res: any) {
  try {
    // 1. Critical Vercel Body-Parser fix:
    // If Vercel's Serverless runtime (@vercel/node) has already consumed the stream and parsed req.body,
    // mark req._body = true so that Express body-parser / express.json does not attempt to re-read an already-drained stream (which causes hanging and Vercel 500/504 timeouts).
    if (req.body !== undefined && req.body !== null && typeof req.body === 'object') {
      req._body = true;
      if (!req.rawBody) {
        try {
          req.rawBody = Buffer.from(JSON.stringify(req.body));
        } catch {
          // ignore
        }
      }
    }

    // 2. Normalize URL for Vercel Serverless Function rewrites (/api/index?path=...)
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
      // Clean path parameter from req.query to avoid downstream collisions
      delete req.query.path;
    } else if (req.url && (req.url.startsWith('/api/index') || req.url.startsWith('/index') || req.url.startsWith('/?path='))) {
      const match = req.url.match(/path=([^&]+)/);
      if (match) {
        const remainingQuery = req.url.includes('&') ? '?' + req.url.split('&').slice(1).join('&') : '';
        req.url = '/api/' + decodeURIComponent(match[1]).replace(/^\/+/, '') + remainingQuery;
      }
    }

    // 3. Delegate to Express application
    return app(req, res);
  } catch (err: any) {
    console.error('Unhandled Vercel Serverless Function Error:', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.',
      });
    }
  }
}
