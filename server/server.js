const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let users = {};
let codeStore = {};
let historyStore = {};
let lastSeen = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!users[roomId]) users[roomId] = [];
    if (!historyStore[roomId]) historyStore[roomId] = [];

    users[roomId].push({
      id: socket.id,
      name: username,
      status: "online",
    });

    io.to(roomId).emit("user-list", users[roomId]);

    socket.emit("load-code", codeStore[roomId] || "// Start coding");
    socket.emit("code-history", historyStore[roomId]);
  });

  socket.on("code-change", ({ roomId, code }) => {
    codeStore[roomId] = code;
    socket.to(roomId).emit("code-update", code);
  });

  socket.on("save-history", ({ roomId, code }) => {
    historyStore[roomId].push({
      code,
      time: new Date().toLocaleTimeString(),
    });

    io.to(roomId).emit("code-history", historyStore[roomId]);
  });

  socket.on("run-code", ({ code, language }) => {
    if (language === "python") {
      fs.writeFileSync("temp.py", code);

      exec("python temp.py", (err, stdout, stderr) => {
        socket.emit("code-output", stdout || stderr || "No Output");
      });
    } else {
      fs.writeFileSync("temp.js", code);

      exec("node temp.js", (err, stdout, stderr) => {
        socket.emit("code-output", stdout || stderr || "No Output");
      });
    }
  });

  // CHAT
  socket.on("chat-message", ({ roomId, message, username }) => {
    io.to(roomId).emit("chat-update", { message, username });
  });

  // TYPING
  socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("typing", username);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    for (let room in users) {
      let user = users[room].find(u => u.id === socket.id);

      if (user) {
        lastSeen[user.name] = new Date().toLocaleTimeString();
      }

      users[room] = users[room].filter(
        (u) => u.id !== socket.id
      );

      io.to(room).emit("user-list", users[room]);
      io.to(room).emit("last-seen", lastSeen);
    }
  });
});

server.listen(5000, () =>
  console.log("Server running on port 5000")
);