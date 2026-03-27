import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { useParams, useLocation } from "react-router-dom";
import Chat from "./Chat";
import "./CodeEditor.css";

const socket = io("http://localhost:5000");

function CodeEditor() {
  const { roomId } = useParams();
  const location = useLocation();

  const username = location.state?.username || "User";

  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("python");
  const [history, setHistory] = useState([]);
  const [lastSeen, setLastSeen] = useState({});
  
  // 🤖 AI STATE
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    socket.emit("join-room", { roomId, username });

    socket.on("user-list", setUsers);
    socket.on("load-code", setCode);
    socket.on("code-update", setCode);
    socket.on("code-output", setOutput);
    socket.on("code-history", setHistory);
    socket.on("last-seen", setLastSeen);

    return () => socket.off();
  }, [roomId, username]);

  const handleChange = (value) => {
    setCode(value);
    socket.emit("code-change", { roomId, code: value });
  };

  const runCode = () => {
    socket.emit("run-code", { code, language });
  };

  const saveHistory = () => {
    socket.emit("save-history", { roomId, code });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Room link copied!");
  };

  // 🤖 ASK AI FUNCTION
  const askAI = async () => {
    setLoadingAI(true);
    setAiResponse("Thinking...");

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
  Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
  "Content-Type": "application/json",
},
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Analyze this ${language} code. Explain errors and improve it:\n\n${code}`,
            },
          ],
        }),
      });

      const data = await res.json();
      setAiResponse(data.choices[0].message.content);
    } catch (err) {
      setAiResponse("Error fetching AI response");
    }

    setLoadingAI(false);
  };

  return (
    <div className="container">

      {/* LEFT */}
      <div className="editor-section">
        <div className="top-bar">
          <h3>
            🚀 Live Code Room
            <br />
            <small>Connected as {username}</small>
          </h3>

          <div>
            <select onChange={(e) => setLanguage(e.target.value)}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>

            <button onClick={runCode}>Run</button>
            <button onClick={saveHistory}>Save</button>
            <button onClick={copyLink}>Share</button>
            <button onClick={askAI}>🤖 Ask AI</button>
          </div>
        </div>

        <Editor
          height="55vh"
          theme="vs-dark"
          value={code}
          onChange={handleChange}
        />

        <div className="output-box">
          <pre>{output}</pre>
        </div>
      </div>

      {/* RIGHT */}
      <div className="sidebar">
        <h4>👥 Users</h4>

        <ul>
          {users.map((u, i) => (
            <li key={i}>🟢 {u.name}</li>
          ))}

          {Object.keys(lastSeen).map((name, i) => (
            <li key={i} style={{ color: "gray" }}>
              ⚫ {name} (last seen {lastSeen[name]})
            </li>
          ))}
        </ul>

        <h4>🕒 History</h4>
        {history.map((h, i) => (
          <div
            key={i}
            className="history-item"
            onClick={() => setCode(h.code)}
          >
            Version {i + 1}
          </div>
        ))}

        {/* 🤖 AI PANEL */}
        <h4>🤖 AI Assistant</h4>
        <div className="ai-box">
          {loadingAI ? "Thinking..." : aiResponse}
        </div>

        <Chat socket={socket} roomId={roomId} username={username} />
      </div>

    </div>
  );
}

export default CodeEditor;