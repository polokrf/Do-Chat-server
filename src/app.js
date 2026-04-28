const express = require('express');
const app = express();
const cors = require('cors');
const auth =require('./routes/auth.route')
const users =require('./routes/users.route')
const friendRequests =require('./routes/friendRequests.route')
const friends =require('./routes/friendsList.route')
const requests =require('./routes/requests.route')
const chats = require('./routes/chats.route')
const notifications = require('./routes/notification.routes');

// middle wear
app.use(express.json());
app.use(cors())

app.get('/',(req, res) => {
  res.send({message:'server is conect'})
})

// auth login register
app.use('/auth', auth)
// get users
app.use('/users',users)
// who friend request
app.use('/requests', requests)
// manage friend request
app.use('/friendRequests', friendRequests)
// get friends 
app.use('/friends', friends)

// only chat route
app.use('/chats',chats)
// only chat route
app.use('/notifications',notifications)



module.exports = app;