const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const router = express.Router();

// my request get 
router.get('/my-request', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).send({ message: 'Missing id' });
    }
    const query ={senderId:userId,status:'pending'}
    const myRequest = await db.collection('friendRequests').find(query).toArray();
    const myRequestId = myRequest.map(r => r.receiverId);
    const result = await db.collection('userCollection').find(
        { _id: { $in: myRequestId.map(id => new ObjectId(id)) } },
        { projection :{password:0}}
      ).toArray();

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
})

// user request 
router.get('/user-request', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).send({ message: 'Missing id' });
    }
    const query = { receiverId: userId, status: 'pending' };
    const userRequest = await db.collection('friendRequests').find(query).toArray();
    const userRequestId = userRequest.map(user => user.senderId);
    const result = await db.collection('userCollection').find(
      { _id: { $in: userRequestId.map(id => new ObjectId(id)) } }, { projection: { password: 0 } }).toArray();
    
    res.send(result)

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
})




module.exports = router;