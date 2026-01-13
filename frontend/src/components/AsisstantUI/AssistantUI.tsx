import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";

// ⬅️ ADDED: markdown + math libs
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function Page() {
  const { token } = useAuth();

  const lastUserMessageIndex = useRef<number>(0);

  // Recreate transport when token changes to ensure latest token is used
  const transport = React.useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat',
      headers: () => ({ Authorization: `Bearer ${token}` })
    }),
    [token]
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate
  } = useChat({
    transport: transport,

    onFinish: ({ message }) => {
      setMessages(prev => {
        const boundary = lastUserMessageIndex.current;
        const pastTurns = prev.slice(0, boundary);
        const thisTurn = prev.slice(boundary);

        const filtered = thisTurn.filter(m => m.role !== "assistant");
        return [...pastTurns, ...filtered, message];
      });
    }
  });

  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || status !== 'ready') return;

    lastUserMessageIndex.current = messages.length;

    sendMessage(
      { text: input },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setInput('');
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ⬅️ UPDATED: Render Markdown + Math
  function renderPart(part: any, idx: number) {
    if (!part) return null;

    if (part.type === 'text') {
      return (
        <ReactMarkdown
          key={idx}
          remarkPlugins={[remarkGfm, remarkMath]}     // ⬅️ ADDED
          rehypePlugins={[rehypeKatex]}               // ⬅️ ADDED
          components={{
            p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
            strong: ({ children }) => <strong>{children}</strong>,
            em: ({ children }) => <em>{children}</em>,
            ul: ({ children }) => <ul style={{ paddingLeft: 20 }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: 20 }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
            code: ({ children }) => (
              <code style={{
                background: "#f3f4f6",
                padding: "2px 4px",
                borderRadius: 4,
                fontSize: 13
              }}>
                {children}
              </code>
            )
          }}
        >
          {part.text}
        </ReactMarkdown>
      );
    }

    if (part.type && part.type.startsWith('tool')) {
      if (part.state === 'output-available') {
        return (
          <div key={idx} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0ea5e9' }}>
              {`Generated SQL: ${String(part.input)}`}
            </div>
            <pre style={{
              background: '#f3f4f6',
              padding: 8,
              borderRadius: 6,
              overflowX: 'auto'
            }}>
              {String(part.output)}
            </pre>
          </div>
        );
      }
      return null;
    }

    return null;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      overflow: 'hidden'
    }}>

      {/* HEADER */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#111827',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>A</div>
          <div style={{ fontWeight: 700 }}>Assistant</div>
        </div>

        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {status === 'ready' ? 'Idle' : status}
        </div>
      </div>

      {/* STOP + RETRY BUTTONS */}
      {(status === 'streaming' || status === 'submitted') && (
        <button
          onClick={() => stop()}
          style={{
            background: '#ef4444',
            color: '#fff',
            padding: '6px 12px',
            margin: 8,
            borderRadius: 6
          }}
        >
          Stop
        </button>
      )}

      {(status === 'ready' && messages.length > 0) && (
        <button
          onClick={() => {
            lastUserMessageIndex.current = messages.length - 1;
            regenerate();
          }}
          style={{
            background: '#0ea5e9',
            color: '#fff',
            padding: '6px 12px',
            margin: 8,
            borderRadius: 6
          }}
        >
          Retry
        </button>
      )}

      {/* CHAT MESSAGES */}
      <div ref={containerRef}
        style={{
          padding: 16,
          overflowY: 'auto',
          flex: 1,
          background: '#f8fafc'
        }}
      >
        {messages.map((message: any) => (
          <div key={message.id}
            style={{
              display: 'flex',
              marginBottom: 12,
              alignItems: 'flex-start',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >

            {message.role !== 'user' && (
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#111827',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginRight: 12
              }}>A</div>
            )}

            <div style={{ maxWidth: '78%', textAlign: message.role === 'user' ? 'right' : 'left' }}>
              <div style={{
                display: 'inline-block',
                padding: '10px 14px',
                borderRadius: 12,
                background: message.role === 'user' ? '#0ea5e9' : '#fff',
                color: message.role === 'user' ? '#fff' : '#111827',
                boxShadow: '0 1px 0 rgba(0,0,0,0.04)'
              }}>
                {Array.isArray(message.parts)
                  ? message.parts.map((p: any, i: number) => renderPart(p, i))
                  : <span>{String(message.content ?? '')}</span>}
              </div>

              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
            </div>

            {message.role === 'user' && (
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#0ea5e9',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginLeft: 12
              }}>U</div>
            )}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <form onSubmit={handleSubmit}
        style={{
          padding: 12,
          borderTop: '1px solid #e5e7eb',
          background: '#fff'
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={status === 'ready' ? 'Send a message...' : 'Assistant is busy...'}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              resize: 'vertical',
              fontSize: 14
            }}
            disabled={status !== 'ready'}
          />

          <button type="submit" disabled={status !== 'ready'}
            style={{
              background: '#111827',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 8
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
