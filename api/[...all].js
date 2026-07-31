// Vercel serverless entry → NestJS app (built to apps/api/dist)
let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { createNestServer } = require('../apps/api/dist/vercel');
      return createNestServer();
    })();
  }
  return appPromise;
}

module.exports = async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Nest bootstrap failed', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: 'API bootstrap failed', error: String(error) }));
  }
};
