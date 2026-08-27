const socket = io();

const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const statusText = document.getElementById('status-text');
const boardEl = document.getElementById('board');
const resetBtn = document.getElementById('reset-btn');

let mySymbol = null;
let myTurn = false;

loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username) {
    socket.emit('user-login', username);
  }
});

socket.on('login-success', (data) => {
  mySymbol = data.symbol;
  loginError.textContent = '';
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  statusText.textContent = `You are "${data.symbol}". Waiting for opponent...`;
});

socket.on('login-error', (message) => {
  loginError.textContent = message;
});

socket.on('players-update', (playersList) => {
  console.log('Players:', playersList);
});

socket.on('game-start', (data) => {
  renderBoard(data.board);
  myTurn = data.currentTurn === mySymbol;
  statusText.textContent = myTurn ? "Your turn!" : "Opponent's turn...";
  resetBtn.classList.add('hidden');
});

socket.on('move-made', (data) => {
  renderBoard(data.board);
});

socket.on('turn-update', (currentTurn) => {
  myTurn = currentTurn === mySymbol;
  statusText.textContent = myTurn ? "Your turn!" : "Opponent's turn...";
});

socket.on('game-over', (data) => {
  renderBoard(data.board);
  if (data.result === 'draw') {
    statusText.textContent = "It's a draw!";
  } else {
    statusText.textContent = data.result === mySymbol ? "You win! 🎉" : "You lose!";
  }
  resetBtn.classList.remove('hidden');
});

socket.on('game-reset', (data) => {
  renderBoard(data.board);
  myTurn = data.currentTurn === mySymbol;
  statusText.textContent = myTurn ? "Your turn!" : "Opponent's turn...";
  resetBtn.classList.add('hidden');
});

resetBtn.addEventListener('click', () => {
  socket.emit('reset-game');
});

function renderBoard(board) {
  boardEl.innerHTML = '';
  board.forEach((cell, index) => {
    const cellEl = document.createElement('div');
    cellEl.classList.add('cell');
    cellEl.textContent = cell || '';
    cellEl.addEventListener('click', () => {
      if (!cell && myTurn) {
        socket.emit('make-move', index);
      }
    });
    boardEl.appendChild(cellEl);
  });
}