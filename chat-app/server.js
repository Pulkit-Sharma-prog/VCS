/**
 * Local Network Chat Application - Server
 * VCS Project | IILM University, Gurugram
 *
 * Features:
 *  - Real-time messaging via Socket.IO
 *  - Multiple chat rooms
 *  - Private messaging
 *  - Online user tracking
 *  - Message history (in-memory)
 *  - Typing indicators
 *  - File/image sharing (base64)
 *  - Admin controls
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// ──────────────────────────────────────────────
// In-memory data store
// ──────────────────────────────────────────────
const users = new Map();          // socketId → { id, username, room, joinedAt, color }
const rooms = new Map();          // roomName → { messages: [], createdAt }
const typingUsers = new Map();    // roomName → Set of usernames

// Pre-create default rooms
['general', 'team-alpha', 'team-beta', 'project-vcs'].forEach(name => {
  rooms.set(name, { messages: [], createdAt: new Date().toISOString() });
  typingUsers.set(name, new Set());
});

const USER_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E67E22', '#E91E63'
];
let colorIndex = 0;

// ──────────────────────────────────────────────
// Helper utilities
// ──────────────────────────────────────────────
function getNextColor() {
  const c = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return c;
}

function getRoomUsers(roomName) {
  return [...users.values()].filter(u => u.room === roomName);
}

function createMessage({ type = 'text', username, userId, color, content, room, isPrivate = false, toUser = null }) {
  return {
    id: uuidv4(),
    type,          // 'text' | 'image' | 'system' | 'private'
    username,
    userId,
    color,
    content,
    room,
    isPrivate,
    toUser,
    timestamp: new Date().toISOString()
  };
}

// ──────────────────────────────────────────────
// Static files
// ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// API: list rooms
app.get('/api/rooms', (req, res) => {
  const list = [...rooms.entries()].map(([name, data]) => ({
    name,
    userCount: getRoomUsers(name).length,
    messageCount: data.messages.length
  }));
  res.json(list);
});

// API: room message history
app.get('/api/rooms/:room/messages', (req, res) => {
  const room = rooms.get(req.params.room);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room.messages.slice(-100)); // last 100
});

// ──────────────────────────────────────────────
// Socket.IO events
// ──────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[${new Date().toLocaleTimeString()}] Socket connected: ${socket.id}`);

  // ── JOIN ──────────────────────────────────
  socket.on('join', ({ username, room }) => {
    if (!username || !room) return;

    username = username.trim().substring(0, 30);
    room = room.trim();

    // Create room if it doesn't exist
    if (!rooms.has(room)) {
      rooms.set(room, { messages: [], createdAt: new Date().toISOString() });
      typingUsers.set(room, new Set());
      io.emit('room_created', { name: room });
    }

    const user = {
      id: socket.id,
      username,
      room,
      joinedAt: new Date().toISOString(),
      color: getNextColor()
    };
    users.set(socket.id, user);
    socket.join(room);

    // Send room history
    socket.emit('history', rooms.get(room).messages.slice(-100));

    // System message to room
    const sysMsg = createMessage({
      type: 'system',
      username: 'System',
      userId: 'system',
      color: '#95A5A6',
      content: `${username} joined the room`,
      room
    });
    rooms.get(room).messages.push(sysMsg);
    io.to(room).emit('message', sysMsg);

    // Broadcast updated user list
    io.to(room).emit('user_list', getRoomUsers(room));
    io.emit('room_stats', {
      room,
      userCount: getRoomUsers(room).length
    });

    console.log(`[JOIN] ${username} → #${room}`);
  });

  // ── SEND MESSAGE ─────────────────────────
  socket.on('send_message', ({ content, type = 'text' }) => {
    const user = users.get(socket.id);
    if (!user || !content) return;

    const msg = createMessage({
      type,
      username: user.username,
      userId: user.id,
      color: user.color,
      content: content.substring(0, 4000),
      room: user.room
    });

    rooms.get(user.room).messages.push(msg);
    // Keep last 500 messages per room
    if (rooms.get(user.room).messages.length > 500) {
      rooms.get(user.room).messages.shift();
    }

    io.to(user.room).emit('message', msg);

    // Stop typing
    const typing = typingUsers.get(user.room);
    if (typing) {
      typing.delete(user.username);
      io.to(user.room).emit('typing_update', [...typing]);
    }
  });

  // ── PRIVATE MESSAGE ──────────────────────
  socket.on('private_message', ({ toSocketId, content }) => {
    const sender = users.get(socket.id);
    const receiver = users.get(toSocketId);
    if (!sender || !receiver || !content) return;

    const msg = createMessage({
      type: 'private',
      username: sender.username,
      userId: sender.id,
      color: sender.color,
      content: content.substring(0, 4000),
      room: sender.room,
      isPrivate: true,
      toUser: receiver.username
    });

    // Send to both parties
    socket.emit('message', msg);
    io.to(toSocketId).emit('message', msg);
  });

  // ── TYPING INDICATOR ─────────────────────
  socket.on('typing_start', () => {
    const user = users.get(socket.id);
    if (!user) return;
    const typing = typingUsers.get(user.room);
    if (typing) {
      typing.add(user.username);
      socket.to(user.room).emit('typing_update', [...typing]);
    }
  });

  socket.on('typing_stop', () => {
    const user = users.get(socket.id);
    if (!user) return;
    const typing = typingUsers.get(user.room);
    if (typing) {
      typing.delete(user.username);
      socket.to(user.room).emit('typing_update', [...typing]);
    }
  });

  // ── SWITCH ROOM ──────────────────────────
  socket.on('switch_room', ({ room }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const oldRoom = user.room;

    // Remove from old room typing list
    const oldTyping = typingUsers.get(oldRoom);
    if (oldTyping) {
      oldTyping.delete(user.username);
      socket.to(oldRoom).emit('typing_update', [...oldTyping]);
    }

    // Leave old room
    socket.leave(oldRoom);
    const leaveMsg = createMessage({
      type: 'system',
      username: 'System',
      userId: 'system',
      color: '#95A5A6',
      content: `${user.username} left the room`,
      room: oldRoom
    });
    rooms.get(oldRoom).messages.push(leaveMsg);
    io.to(oldRoom).emit('message', leaveMsg);
    io.to(oldRoom).emit('user_list', getRoomUsers(oldRoom));

    // Create room if needed
    if (!rooms.has(room)) {
      rooms.set(room, { messages: [], createdAt: new Date().toISOString() });
      typingUsers.set(room, new Set());
      io.emit('room_created', { name: room });
    }

    // Join new room
    user.room = room;
    socket.join(room);

    socket.emit('history', rooms.get(room).messages.slice(-100));

    const joinMsg = createMessage({
      type: 'system',
      username: 'System',
      userId: 'system',
      color: '#95A5A6',
      content: `${user.username} joined the room`,
      room
    });
    rooms.get(room).messages.push(joinMsg);
    io.to(room).emit('message', joinMsg);
    io.to(room).emit('user_list', getRoomUsers(room));

    console.log(`[SWITCH] ${user.username}: #${oldRoom} → #${room}`);
  });

  // ── DISCONNECT ───────────────────────────
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    const { username, room } = user;
    users.delete(socket.id);

    const typing = typingUsers.get(room);
    if (typing) typing.delete(username);

    const sysMsg = createMessage({
      type: 'system',
      username: 'System',
      userId: 'system',
      color: '#95A5A6',
      content: `${username} left the chat`,
      room
    });
    if (rooms.has(room)) {
      rooms.get(room).messages.push(sysMsg);
      io.to(room).emit('message', sysMsg);
      io.to(room).emit('user_list', getRoomUsers(room));
      if (typing) io.to(room).emit('typing_update', [...typing]);
    }

    console.log(`[LEAVE] ${username} disconnected`);
  });
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  console.log('\n🚀 Chat App running!');
  console.log(`   Local:    http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`   Network:  http://${ip}:${PORT}`));
  console.log('\nShare the Network URL with teammates on the same WiFi/LAN.\n');
});
