const express = require('express');
const WebSocket = require('ws');
const cron = require('node-cron');
const fs = require('fs');

// In-memory event storage (for simplicity, no database)
let events = [];

// Initialize Express app
const app = express();
app.use(express.json());

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });
let clients = [];

// Event logging function (log completed events to a file)
function logCompletedEvent(event) {
  fs.appendFile('completed_events.log', JSON.stringify(event) + '\n', (err) => {
    if (err) console.error('Error logging completed event:', err);
  });
}

// Endpoint to create a new event
app.post('/events', (req, res) => {
  const { title, description, scheduledTime } = req.body;
  const event = {
    id: Date.now().toString(),
    title,
    description,
    scheduledTime: new Date(scheduledTime),
    status: 'pending',
  };
  events.push(event);
  res.status(201).json(event);
});

// Endpoint to fetch all upcoming events
app.get('/events', (req, res) => {
  const upcomingEvents = events.filter(event => new Date(event.scheduledTime) > new Date());
  res.json(upcomingEvents);
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

// Function to send WebSocket notifications to clients
function sendNotification(message) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Cron job to check events and send notifications
cron.schedule('* * * * *', () => {
  const now = new Date();
  events.forEach(event => {
    const timeDiff = event.scheduledTime - now;
    if (timeDiff <= 5 * 60 * 1000 && timeDiff > 4 * 60 * 1000 && event.status === 'pending') {
      // Send notification 5 minutes before the event
      sendNotification({ type: 'event-notification', event });
    }
    if (event.scheduledTime <= now && event.status === 'pending') {
      // Mark the event as completed and log it
      event.status = 'completed';
      logCompletedEvent(event);
      sendNotification({ type: 'event-completed', event });
    }
  });
});

// WebSocket upgrade for API server
app.server = app.listen(3000, () => {
  console.log('API server running on http://localhost:3000');
});

// WebSocket upgrade handling
app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});


