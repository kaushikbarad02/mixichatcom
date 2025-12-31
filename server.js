const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Keep track of waiting users
let waitingUser = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('find-match', () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            // Pair them up
            console.log(`Pairing ${socket.id} with ${waitingUser.id}`);

            const partner = waitingUser;
            waitingUser = null;

            // Notify both users
            // User who just joined will initiate the offer (caller)
            socket.emit('match-found', { partnerId: partner.id, initiator: true });
            partner.emit('match-found', { partnerId: socket.id, initiator: false });
        } else {
            // Add to waiting room
            waitingUser = socket;
            console.log(`${socket.id} is waiting for a partner...`);
        }
    });

    socket.on('signal', ({ to, signal }) => {
        io.to(to).emit('signal', { from: socket.id, signal });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (waitingUser && waitingUser.id === socket.id) {
            waitingUser = null;
        }
        // Notify partner if they were in a chat
        socket.broadcast.emit('partner-disconnected', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
