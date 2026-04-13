const express = require('express');
const { getDB } = require('../db');
const router = express.Router();

// search then get all users
router.get('/', async (req, res) => {
  const db = getDB();
  const { name } = req.query;
  if (!name || name.trim() === '') {
    return res.send([]); 
  }
  const query={}
  if (name) {
     query.$or=[{ name: { $regex: name, $options: 'i' } }]  ;

  } 
  const result = await db.collection('userCollection').find(query,{ projection: { password: 0 } }).limit(10).toArray()
  
  res.send(result)
})






module.exports = router;