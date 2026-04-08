const express = require('express');
const app = express();
const cors = require('cors');
const auth =require('./routes/auth.route')

// middle wear
app.use(express.json());
app.use(cors())

app.get('/',(req, res) => {
  res.send({message:'server is conect'})
})

app.use('/auth',auth)



module.exports = app;