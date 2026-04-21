const { createServer } = require('node:http');
require('dotenv').config();
const app = require('./src/app');
const { connectDB, getDB } = require('./src/db'); //server connect
const { Server } = require('socket.io');
const port = process.env.PORT || 5000;

// socket io connect

const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://do-chat-client.vercel.app"
    ]
  }
});

//get user id and convert socket.id
const users = {};

io.on('connection', socket => {
  console.log('a user connected', socket.id);

  // if user connect  then run
  socket.on('join', userId => {

    if (!users[userId]) {
      users[userId]=[]
    }
     users[userId].push(socket.id)

    io.emit('user-status', {
      userId,
      status:'online'
    })
    
  });

  // typing include
  socket.on('typing', ({senderId,receiverId}) => {
     if (!senderId || !receiverId) {
       console.log('Invalid message data');
       return;
    } 
    
    const receivedSocketId = users[receiverId];
    if (receivedSocketId) {
      receivedSocketId.forEach(id => {
        io.to(id).emit('typing', {
          senderId
        })
      })
    }
  })

  // stop typing 
  socket.on('stopTyping', ({ senderId, receiverId }) => {
     if (!senderId || !receiverId) {
       console.log('Invalid message data');
       return;
    } 

   
    const receivedSocketId = users[receiverId];
    if (receivedSocketId) {
      receivedSocketId.forEach(id => {
        io.to(id).emit('stopTyping', {
          senderId,
        });
      });
    }
    
  });

  // send message
  socket.on('sendMessage',(data) => {
    const { senderId, receiverId, message } = data;
    if (!senderId || !receiverId || !message) {
      console.log('Invalid message data');
      return;
    } 
    const receiverSocketId = users[receiverId];
   if (receiverSocketId) {
     receiverSocketId.forEach(id => {
        io.to(id).emit('receiveMessage', {
          senderId,
          message,
          receiverId,
          createdAt: new Date(),
        });
      })
    }
  });

  // when user disconnect
  socket.on('disconnect', () => {
    for (let userId in users) {
      users[userId]=users[userId].filter(id=> id !== socket.id)
      if (users[userId].length === 0) {
        delete users[userId];

        io.emit('user-status', {
          userId: userId,
          status:'offline'
          
        });
       
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
