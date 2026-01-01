"use client";

import { useEffect, useMemo, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

// Basic business identity used for the header and avatar initials.
const BUSINESS = {
  name: "BrightPath Studio",
  avatar: "BP",
};

// Local storage key for persisting the chat on the current device.
const STORAGE_KEY = "whatsapp-chat-history";

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Restore chat history from localStorage on first load.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch {
        setMessages([]);
      }
    }
  }, []);

  useEffect(() => {
    // Persist chat history to localStorage on every change.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const canSend = input.trim().length > 0 && !isTyping;

  const chatBodyStyle = useMemo(
    () => ({
      background: "#111B21",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      padding: "24px",
      boxSizing: "border-box" as const,
    }),
    []
  );

  // Send the user message to the server and append the AI reply.
  const onSend = async () => {
    if (!canSend) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Send the full message history to the server route.
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "Sorry, something went wrong.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Fallback response if the server request fails.
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't respond right now.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow pressing Enter to send the message.
    if (event.key === "Enter") {
      onSend();
    }
  };

  return (
    <div style={chatBodyStyle}>
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          background: "#0B141A",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        {/* WhatsApp-like header with business identity */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            background: "#202C33",
            color: "#E9EDEF",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#2A3942",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
            }}
          >
            {BUSINESS.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{BUSINESS.name}</div>
            <div style={{ fontSize: "12px", color: "#AEBAC1" }}>
              Typically replies in minutes
            </div>
          </div>
        </header>

        {/* Chat thread area */}
        <main
          style={{
            flex: 1,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundImage:
              "linear-gradient(rgba(11,20,26,0.9), rgba(11,20,26,0.95)), url('https://www.transparenttextures.com/patterns/cubes.png')",
            overflowY: "auto",
            maxHeight: "70vh",
          }}
        >
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: "8px",
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#2A3942",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#E9EDEF",
                      fontSize: "12px",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {BUSINESS.avatar}
                  </div>
                )}
                <div
                  style={{
                    background: isUser ? "#005C4B" : "#202C33",
                    color: "#E9EDEF",
                    padding: "12px 14px",
                    borderRadius: isUser
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    maxWidth: "70%",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#AEBAC1",
                      textAlign: "right",
                      marginTop: "6px",
                    }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Typing indicator while the AI reply is pending */}
          {isTyping && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#2A3942",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#E9EDEF",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {BUSINESS.avatar}
              </div>
              <div
                style={{
                  background: "#202C33",
                  color: "#AEBAC1",
                  padding: "10px 16px",
                  borderRadius: "16px 16px 16px 4px",
                }}
              >
                typing…
              </div>
            </div>
          )}
        </main>

        {/* Message composer */}
        <footer
          style={{
            padding: "16px",
            background: "#202C33",
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message"
            style={{
              flex: 1,
              background: "#2A3942",
              border: "none",
              borderRadius: "20px",
              padding: "12px 16px",
              color: "#E9EDEF",
              outline: "none",
              fontSize: "14px",
            }}
          />
          <button
            onClick={onSend}
            disabled={!canSend}
            style={{
              background: canSend ? "#00A884" : "#2A3942",
              color: "#E9EDEF",
              border: "none",
              borderRadius: "20px",
              padding: "0 22px",
              fontWeight: 600,
              cursor: canSend ? "pointer" : "not-allowed",
            }}
          >
            Send
          </button>
        </footer>
      </div>
    </div>
  );
}
