import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function routing(apiOrigin = '') {
  let target = '/.netlify/functions/api-unavailable';
  if (apiOrigin) {
    const url = new URL(apiOrigin);
    // This is build-time configuration, never a browser-provided proxy target.
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || /[\s]/.test(apiOrigin) || /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(url.hostname)) {
      throw new Error('GAME_API_ORIGIN must be a public HTTPS origin, without a path, credentials, or query.');
    }
    target = `${url.origin}/v1/:splat`;
  }
  return `/v1/* ${target} 200!\n/* /index.html 200\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await writeFile('apps/player/dist/_redirects', routing(process.env.GAME_API_ORIGIN));
  await writeFile('apps/player/dist/robots.txt', 'User-agent: *\nDisallow: /\n');
  console.log(process.env.GAME_API_ORIGIN ? 'Netlify player build: hosted API proxy configured.' : 'Netlify player build: guest preview ready; hosted API not configured.');
}
