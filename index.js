const { createServer } = require('node:http');
require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/db'); //server connect
const { Server } = require('socket.io');
const port = process.env.PORT || 5000;

// socket io connect

const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin:'*'
  }
});

//get user id and convert socket.id
const users = {};

io.on('connection', socket => {
  console.log('a user connected', socket.id);

  // if user connect  then run
  socket.on('join', userId => {
    users[userId] = socket.id;
    
  });

  // send message
  socket.on('sendMessage', data => {
    const { senderId, receiverId, message } = data;
    if (!senderId || !receiverId || !message) return;
    const receiverSocketId = users[receiverId];

    
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('receiveMessage', {
        senderId,
        message,
        receiverId,
        createdAt: new Date(),
        
      });
    }
  });

  // when user disconnect
  socket.on('disconnect', () => {
    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];
      }
    }
  })
});


// mongodb connect

const startServer = async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log('Your server is running port : ', port);
    });
  } catch (error) {
    console.log(error);
  }
};
startServer();
