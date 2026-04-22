const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const router = express.Router();

// my request get 
router.get('/my-request', async (req, res) => {
  try {
    const db = getDB();
    const { userId,cursor } = req.query;
    if (!userId) {
      return res.status(400).send({ message: 'Missing id' });
    }

    const limit =6
    const query = {
      $and:[
        { senderId: userId, status: 'pending' },
        cursor ?{_id:{$lt:new ObjectId(cursor)}}:{}
    ]}
    const myRequest = await db.collection('friendRequests').find(query).sort({ _id: -1 }).limit(limit).toArray();
    const myRequestId = myRequest.map(r => r.receiverId);
    const result = await db.collection('userCollection').find(
        { _id: { $in: myRequestId.map(id => new ObjectId(id)) } },
        { projection :{password:0}}
    ).toArray();
    
    const nextCursor = myRequest.length === limit ? myRequest[myRequest.length - 1]._id : null;

    res.send({result,nextCursor});
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
})

// user request 
router.get('/user-request', async (req, res) => {
  try {
    const db = getDB();
    const { userId,cursor } = req.query;
    const limit =6
    if (!userId) {
      return res.status(400).send({ message: 'Missing id' });
    }
    const query = {
      $and: [
        { receiverId: userId, status: 'pending' },
       cursor ?{_id:{$lt:new ObjectId(cursor)}}:{}
    ]} 
    const userRequest = await db.collection('friendRequests').find(query).sort({ _id: -1 }).limit(limit).toArray();
    const userRequestId = userRequest.map(user => user.senderId);
    const result = await db.collection('userCollection').find(
      { _id: { $in: userRequestId.map(id => new ObjectId(id)) } }, { projection: { password: 0 } }).toArray();
    
    const nextCursor = userRequest.length === limit ? userRequest[userRequest.length - 1]._id : null;

    res.send({ result, nextCursor });

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
})




module.exports = router;