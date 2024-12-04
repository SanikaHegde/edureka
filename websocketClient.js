const WebSocket = require('ws');

// Connect to the WebSocket server
const socket = new WebSocket('ws://localhost:3000');

// Event listener for connection open
socket.on('open', function() {
  console.log('Connected to WebSocket server');
});

// Event listener for receiving messages
socket.on('message', function(data) {
  console.log('Received message:', data);
});

// Event listener for errors
socket.on('error', function(error) {
  console.log('WebSocket Error:', error);
});

// Event listener for connection close
socket.on('close', function() {
  console.log('Disconnected from WebSocket server');
});

