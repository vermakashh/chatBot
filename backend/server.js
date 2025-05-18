const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const voiceUploadRoute = require("./routes/voiceUpload");
const Message = require("./models/Message");

dotenv.config();

const app = express();

const allowedOrigins = [
  "https://chatbot-ten-sigma-93.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", voiceUploadRoute); // ✅ Voice upload route

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// HTTP + Socket.io server
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const ttsCloneRoute = require("./routes/ttsCloneRoute");
app.use("/api/tts-clone", ttsCloneRoute);

const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register-user", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`Registered user ${userId} → Socket ${socket.id}`);
    io.emit("online-users", Object.keys(connectedUsers));
  });

  socket.on("send-message", async ({ senderId, receiverId, message }) => {
    const newMsg = await Message.create({ senderId, receiverId, message });

    const targetSocketId = connectedUsers[receiverId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("receive-message", newMsg);
    }

    socket.emit("receive-message", newMsg);
  });

  socket.on("typing", ({ from, to }) => {
    const targetSocket = connectedUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit("typing", { from });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Object.keys(connectedUsers).forEach((key) => {
      if (connectedUsers[key] === socket.id) delete connectedUsers[key];
    });
    io.emit("online-users", Object.keys(connectedUsers));
  });
});

app.get("/api/messages/:sender/:receiver", async (req, res) => {
  const { sender, receiver } = req.params;
  const msgs = await Message.find({
    $or: [
      { senderId: sender, receiverId: receiver },
      { senderId: receiver, receiverId: sender }
    ]
  }).sort({ timestamp: 1 });
  res.json(msgs);
});

server.listen(5001, () => console.log("Server running on port 5001"));
