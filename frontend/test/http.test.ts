import assert from 'node:assert/strict';
import test from 'node:test';
import { HTTPError } from 'ky';

import { http } from '../src/api/http';

const url = 'https://example.test/api/leaderboard';

test('GET recovers after a temporary server failure', async (context) => {
  let attempts = 0;
  context.mock.method(globalThis, 'fetch', async () => {
    attempts += 1;
    return attempts === 1
      ? new Response(null, { status: 503 })
      : Response.json([{ name: 'Ada', score: 100 }]);
  });

  const entries = await http.get(url).json();

  assert.deepEqual(entries, [{ name: 'Ada', score: 100 }]);
  assert.equal(attempts, 2);
});

test('GET rejects a permanent client error without retrying', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () =>
    Response.json({ message: 'Invalid limit' }, { status: 400 }),
  );

  await assert.rejects(http.get(url), (error: unknown) =>
    error instanceof HTTPError && error.response.status === 400,
  );
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('score submission is not retried even after a server failure', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () =>
    new Response(null, { status: 503 }),
  );

  await assert.rejects(
    http.post(url, { json: { name: 'Ada', score: 100 } }),
    HTTPError,
  );
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('leaving during retry delay cancels GET without another attempt', async (context) => {
  const controller = new AbortController();
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => {
    // Let Ky enter its retry delay before simulating navigation away.
    setTimeout(() => controller.abort(), 0);
    return new Response(null, { status: 503 });
  });

  await assert.rejects(
    http.get(url, { signal: controller.signal }),
    (error: unknown) => error instanceof Error && error.name === 'AbortError',
  );
  assert.equal(fetchMock.mock.callCount(), 1);
});
