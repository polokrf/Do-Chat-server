const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const { verifyJWT } = require('../../middlewear');

const router = express.Router();

// search then get all users
router.get('/', verifyJWT, async (req, res) => {
  const db = getDB();
  const { name, cursor } = req.query;
  
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



// get only user 
router.get('/only-one-user',verifyJWT, async (req,res) => {
   try {
    const db = getDB();
     const { userId } = req.query;
     if (!userId) {
       res.status(400).send({ message: 'error' })
       return
     }
    const query = { _id: new ObjectId(userId) };
    
    res.send(result);
   } catch (error) {
     console.log(error)
     res.status(500).send({message:'server error'})
   }
 })



module.exports = router;