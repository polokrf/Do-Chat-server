const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const router = express.Router();

// search then get all users
router.get('/', async (req, res) => {
  const db = getDB();
  const { name, cursor } = req.query;
  console.log(name)
  if (!name || name.trim() === '') {
    return res.send([]); 
  }
 
  const query = {
    $and: [{ $or: [{ name: { $regex: name, $options: 'i' } }] },
      cursor ? { _id: {$lt: new ObjectId(cursor)} }:{}
    ],
  };
  const limit =10
  const users = await db.collection('userCollection').find(query, { projection: { password: 0 } }).sort({createAt: -1}).limit(limit).toArray();

  const nextCursor = users.length === limit ? users[users.length - 1]._id : null;
  // console.log(nextCursor,users)
  
  res.send({users,nextCursor})
})






module.exports = router;