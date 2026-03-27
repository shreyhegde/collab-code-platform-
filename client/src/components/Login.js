import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (!username || !roomId) {
      alert("Enter all fields");
      return;
    }

    navigate(`/room/${roomId}`, {
      state: { username },
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>🚀 CodeSync</h1>
        <p>Real-time collaborative coding platform</p>

        <input
          type="text"
          placeholder="Enter your name"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter Room ID"
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button onClick={joinRoom}>Join Room</button>

      </div>
    </div>
  );
}

export default Login;