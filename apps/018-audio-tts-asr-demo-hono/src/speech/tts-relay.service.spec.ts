import { describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import type { ENV } from '../env';
import { TtsRelayService } from './tts-relay.service';

type TestSession = {
  ready: boolean;
  pendingChunks: string[];
  completionPending: boolean;
  tencentWs?: WebSocket;
};

type TestableTtsRelayService = {
  sessions: Map<string, TestSession>;
  flushPendingChunks(session: TestSession): void;
  completeTencentSessionIfReady(session: TestSession): void;
};

const env: ENV = {
  OPENAI_API_KEY: 'test',
  OPENAI_BASE_URL: 'https://example.com',
  MODEL_NAME: 'test-model',
  SECRET_ID: 'test-secret-id',
  SECRET_KEY: 'test-secret-key',
  APP_ID: 123456,
  TTS_VOICE_TYPE: 502006,
  PORT: 3000,
  HOST: '127.0.0.1',
};

describe('TtsRelayService', () => {
  it('waits for Tencent readiness before sending buffered text and completion', () => {
    const service = new TtsRelayService(env);
    const clientWs = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      close: vi.fn(),
    } as unknown as WebSocket;
    const tencentSend = vi.fn();
    const tencentWs = {
      readyState: WebSocket.OPEN,
      send: tencentSend,
      close: vi.fn(),
    } as unknown as WebSocket;

    const sessionId = service.registerClient(clientWs, 'test-session');
    const testable = service as unknown as TestableTtsRelayService;
    const session = testable.sessions.get(sessionId);
    expect(session).toBeDefined();
    if (!session) return;
    session.tencentWs = tencentWs;

    service.handleAiStreamEvent({ type: 'chunk', sessionId, chunk: '你好' });
    service.handleAiStreamEvent({ type: 'end', sessionId });

    expect(tencentSend).not.toHaveBeenCalled();
    expect(session.completionPending).toBe(true);

    session.ready = true;
    testable.flushPendingChunks(session);
    testable.completeTencentSessionIfReady(session);

    const messages = tencentSend.mock.calls.map(([payload]) => JSON.parse(String(payload)));
    expect(messages.map((message) => message.action)).toEqual([
      'ACTION_SYNTHESIS',
      'ACTION_COMPLETE',
    ]);
    expect(messages[0].data).toBe('你好');
    expect(session.completionPending).toBe(false);
  });
});
