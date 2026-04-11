const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const router = express.Router();

// own friends get

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.query;
     if (!userId) {
       return res.status(400).send({ message: 'Missing id' });
     }
    const query = {
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ],
    };
    const friendsList = await db.collection('friendRequests').find(query).toArray();
    const friendsId = friendsList.map(f => f.senderId === userId ? f.receiverId : f.senderId);
    const friends = await db
      .collection('userCollection')
      .find(
        { _id: { $in: friendsId.map(id => new ObjectId(id)) } },
        { projection :{password:0}},
      )
      .toArray();

    res.send(friends)
   
  } catch (error) {
    console.log(error);
    res.status(500).send('server error')
  }
})




module.exports = router;