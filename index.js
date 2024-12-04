const express = require('express');
const WebSocket = require('ws');
const cron = require('node-cron');
const fs = require('fs');
const app = express();

app.use(express.json()); 


let events = [];

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log("New WebSocket connection established");

  // Send a welcome message when a new client connects
  ws.send(JSON.stringify({ message: 'Welcome to Event Notifications API' }));
  
  // Optionally, send the upcoming events when the client connects
  const upcomingEvents = events.filter(event => event.status === "pending");
  ws.send(JSON.stringify({ events: upcomingEvents }));
});

// Utility to generate a unique ID for events
function generateUniqueId() {
  return `${Date.now()}-${Math.random()}`;
}

// Endpoint to create an event
app.post('/events', (req, res) => {
  const { title, description, scheduledTime } = req.body;

  // Create new event object
  const newEvent = {
    id: generateUniqueId(),
    title,
    description,
    scheduledTime,
    status: "pending"
  };

  // Check for overlapping events before adding
  checkEventOverlap(newEvent);

  // Add the new event to in-memory events array
  events.push(newEvent);

  // Respond with the new event data
  res.status(201).send(newEvent);
});

// Endpoint to fetch all upcoming events
app.get('/events', (req, res) => {
  const upcomingEvents = events.filter(event => event.status === "pending");
  res.status(200).send(upcomingEvents);
});

// Function to check for overlapping events
function checkEventOverlap(newEvent) {
  const newEventStart = new Date(newEvent.scheduledTime);

  events.forEach(existingEvent => {
    const existingEventStart = new Date(existingEvent.scheduledTime);

    // If events overlap in time (within 30 minutes), notify
    if (Math.abs(newEventStart - existingEventStart) < 30 * 60 * 1000) {
      wss.clients.forEach(client => {
        client.send(JSON.stringify({
          message: `Warning: Event '${newEvent.title}' overlaps with '${existingEvent.title}'.`
        }));
      });
    }
  });
}

// Cron job to notify clients 5 minutes before an event starts
cron.schedule('* * * * *', () => {
  const currentTime = new Date();

  events.forEach(event => {
    const eventTime = new Date(event.scheduledTime);
    const timeDifference = eventTime - currentTime;

    if (timeDifference <= 5 * 60 * 1000 && timeDifference > 0) {
      // Notify WebSocket clients about this event starting in 5 minutes
      wss.clients.forEach(client => {
        client.send(JSON.stringify({
          message: `Event '${event.title}' is about to start in 5 minutes!`
        }));
      });
    }
  });
});

// Function to log completed events asynchronously to a file
function logCompletedEvent(event) {
  fs.appendFile('completed_events.json', JSON.stringify(event) + '\n', err => {
    if (err) {
      console.error('Error logging event:', err);
    }
  });
}

// Sample code to mark an event as completed (for demonstration purposes)
function markEventAsCompleted(eventId) {
  const event = events.find(e => e.id === eventId);
  if (event) {
    event.status = 'completed';
    logCompletedEvent(event);  // Log completed event
  }
}

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
