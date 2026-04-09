const express = require('express');
const app = express();
const cors = require('cors');
const auth =require('./routes/auth.route')
const users =require('./routes/users.route')

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



module.exports = app;