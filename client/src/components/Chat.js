import React, { useState, useEffect } from "react";

function Chat({ socket, roomId, username }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  useEffect(() => {
    socket.on("chat-update", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (user) => {
      setTypingUser(user);
      setTimeout(() => setTypingUser(""), 1500);
    });

    return () => socket.off();
  }, [socket]);

  const sendMessage = () => {
    if (!message) return;

    socket.emit("chat-message", { roomId, message, username });
    setMessages((prev) => [...prev, { message, username }]);
    setMessage("");
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { roomId, username });
  };

  return (
    <div className="chat-box">
      <h4>💬 Chat</h4>

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.username}:</b> {m.message}
          </div>
        ))}
      </div>

      {typingUser && (
        <p style={{ fontSize: "12px", color: "gray" }}>
          {typingUser} is typing...
        </p>
      )}

      <div className="chat-input">
        <input
          value={message}
          onChange={handleTyping}
          placeholder="Type..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chat;