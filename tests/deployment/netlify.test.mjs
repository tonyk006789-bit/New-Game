import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routing} from '../../scripts/netlify-setup.mjs';

test('API requests route to the player function before the app shell', () => {
  assert.equal(routing().split('\n')[0], '/v1/* /.netlify/functions/game-api/v1/:splat 200!');
});

test('configured API uses a same-origin rewrite before the SPA fallback', () => {
  assert.equal(routing('https://api.example.com'), '/v1/* https://api.example.com/v1/:splat 200!\n/* /index.html 200\n');
});

test('reject credentials, local endpoints and redirect-file injection', () => {
  for (const value of ['http://api.example.com', 'https://user:secret@api.example.com', 'https://localhost', 'https://127.0.0.1', 'https://10.0.0.1', 'https://192.168.0.1', 'https://[::1]', 'https://api.example.com/v1', 'https://api.example.com?key=secret', 'https://api.example.com\n/* https://other.example 200']) {
    assert.throws(() => routing(value));
  }
});
