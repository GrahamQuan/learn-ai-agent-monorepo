'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessagePart } from './components/ToolPanels';

/** 后端地址（由 Next.js catch-all Route Handler 直接交给 Hono） */
const CHAT_URL = '/api/ai/chat';
const BOTTOM_THRESHOLD = 120;

export default function App() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: CHAT_URL,
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, clearError } = useChat<UIMessage>({
    transport,
  });
  const [input, setInput] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldFollowOutputRef = useRef(true);

  const busy = status === 'submitted' || status === 'streaming';
  const canSend = status === 'ready' && input.trim().length > 0;
  const lastAssistant = messages.filter((message) => message.role === 'assistant').at(-1);

  const isNearBottom = useCallback(() => {
    const container = messagesRef.current;
    if (!container) return true;

    return container.scrollHeight - container.scrollTop - container.clientHeight <= BOTTOM_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = messagesRef.current;
    if (!container) return;

    shouldFollowOutputRef.current = true;
    container.scrollTo({ top: container.scrollHeight });
    setShowScrollToBottom(false);
  }, []);

  useEffect(() => {
    if (!shouldFollowOutputRef.current) return;

    const frame = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(frame);
  }, [messages, status, scrollToBottom]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;

    const observer = new ResizeObserver(() => {
      if (shouldFollowOutputRef.current) {
        scrollToBottom();
      }
    });
    observer.observe(thread);

    return () => observer.disconnect();
  }, [scrollToBottom]);

  const submitMessage = useCallback(() => {
    if (!canSend) return;

    shouldFollowOutputRef.current = true;
    setShowScrollToBottom(false);
    void sendMessage({ text: input });
    setInput('');

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [canSend, input, sendMessage]);

  return (
    <div className='chat-app'>
      <header className='chat-header'>
        <div className='chat-header__inner'>
          <div>
            <h1>agui</h1>
            <p className='chat-sub'>后端：{CHAT_URL}</p>
          </div>
          {busy && (
            <button type='button' className='btn-stop' onClick={() => stop()}>
              停止
            </button>
          )}
        </div>
      </header>

      <main className='chat-main'>
        <div
          ref={messagesRef}
          className='chat-messages'
          role='log'
          aria-live='polite'
          onScroll={() => {
            const nearBottom = isNearBottom();
            shouldFollowOutputRef.current = nearBottom;
            setShowScrollToBottom(!nearBottom);
          }}
        >
          <div ref={threadRef} className={'chat-thread' + (messages.length === 0 ? ' chat-thread--empty' : '')}>
            {messages.length === 0 && (
              <div className='chat-empty'>
                <h2>今天想聊点什么？</h2>
                <p>输入问题开始对话</p>
              </div>
            )}
            {messages.map((message) => {
              const textPartIndices = message.parts
                .map((part, index) => (part.type === 'text' ? index : -1))
                .filter((index) => index >= 0);
              const lastTextPartIndex = textPartIndices.at(-1);

              return (
                <article key={message.id} className={'chat-bubble chat-bubble--' + message.role}>
                  <span className='chat-role'>{message.role === 'user' ? '你' : '助手'}</span>
                  <div className='chat-body'>
                    {message.parts.map((part, index) => (
                      <MessagePart
                        key={message.id + '-p-' + index}
                        part={part}
                        textStreamActive={
                          part.type === 'text' &&
                          message.role === 'assistant' &&
                          message.id === lastAssistant?.id &&
                          index === lastTextPartIndex &&
                          busy
                        }
                      />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {showScrollToBottom && (
          <button type='button' className='scroll-to-bottom' onClick={scrollToBottom} aria-label='滚动到最新消息'>
            ↓
          </button>
        )}
      </main>

      <footer className='chat-footer'>
        <div className='chat-footer__inner'>
          {error && (
            <div className='chat-error' role='alert'>
              <span>{error.message}</span>
              <button type='button' onClick={() => clearError()}>
                关闭
              </button>
            </div>
          )}

          <form
            className='chat-form'
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage();
            }}
          >
            <textarea
              ref={inputRef}
              className='chat-input'
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.currentTarget.style.height = 'auto';
                event.currentTarget.style.height = Math.min(event.currentTarget.scrollHeight, 200) + 'px';
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
              placeholder='输入消息，Enter 发送，Shift+Enter 换行'
              rows={1}
              disabled={status !== 'ready'}
              aria-label='消息输入'
            />
            <div className='chat-actions'>
              <span className='chat-status'>
                {status === 'ready' && '就绪'}
                {status === 'submitted' && '已发送…'}
                {status === 'streaming' && '生成中…'}
                {status === 'error' && '出错'}
              </span>
              <button type='submit' disabled={!canSend}>
                发送
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}
