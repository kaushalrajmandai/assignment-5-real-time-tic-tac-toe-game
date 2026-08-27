// Real-Time Tic Tac Toe - Assignment 5
// Kaushal Dinesh Rajmandai - 150096725111
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const mongoose = require('mongoose');
const GameHistory = require('./models/GameHistory');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let players = {};       // { socketId: { username, symbol } }
let board = Array(9).fill(null);
let currentTurn = 'X';
let gameActive = false;

function checkWinner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a, b1, c] of lines) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  }
  if (b.every(cell => cell !== null)) return 'draw';
  return null;
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('user-login', (username) => {
    const currentPlayers = Object.values(players);

    if (currentPlayers.length >= 2) {
      socket.emit('login-error', 'Game is full. Try again later.');
      return;
    }

    const usernameTaken = currentPlayers.some(p => p.username === username);
    if (usernameTaken || !username || username.trim() === '') {
      socket.emit('login-error', 'Invalid or duplicate username.');
      return;
    }

    const symbol = currentPlayers.length === 0 ? 'X' : 'O';
    players[socket.id] = { username, symbol };

    socket.emit('login-success', { username, symbol });
    io.emit('players-update', Object.values(players));

    if (Object.values(players).length === 2) {
      gameActive = true;
      board = Array(9).fill(null);
      currentTurn = 'X';
      io.emit('game-start', { players: Object.values(players), board, currentTurn });
    }
  });

  socket.on('make-move', (index) => {
    const player = players[socket.id];
    if (!player || !gameActive) return;
    if (player.symbol !== currentTurn) return;
    if (board[index] !== null) return;

    board[index] = player.symbol;
    io.emit('move-made', { board, lastMove: index, symbol: player.symbol });

        const result = checkWinner(board);
    if (result) {
      gameActive = false;
      io.emit('game-over', { result, board });

      const playerList = Object.values(players);
      const playerX = playerList.find(p => p.symbol === 'X')?.username || 'Unknown';
      const playerO = playerList.find(p => p.symbol === 'O')?.username || 'Unknown';

      const history = new GameHistory({
        playerX,
        playerO,
        winner: result
      });

      history.save()
        .then(() => console.log('Game history saved'))
        .catch(err => console.error('Error saving game history:', err));

    } else {
      currentTurn = currentTurn === 'X' ? 'O' : 'X';
      io.emit('turn-update', currentTurn);
    }
  });

  socket.on('reset-game', () => {
    board = Array(9).fill(null);
    currentTurn = 'X';
    gameActive = Object.values(players).length === 2;
    io.emit('game-reset', { board, currentTurn });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    delete players[socket.id];
    gameActive = false;
    io.emit('players-update', Object.values(players));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});