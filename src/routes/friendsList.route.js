const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const router = express.Router();

// own friends get

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { userId,cursor } = req.query;
     if (!userId) {
       return res.status(400).send({ message: 'Missing id' });
     }
    const query = {
      $and: [
        {
          $or: [
            { senderId: userId, status: 'accepted' },
            { receiverId: userId, status: 'accepted' },
          ],
        },
        ...(cursor && { _id: { $lt: new ObjectId(cursor) } }),
      ],
    };
    const limit =10
    const friendsList = await db.collection('friendRequests').find(query).sort({ _id: -1 }).limit(limit) .toArray();
    const friendsId = friendsList.map(f => f.senderId === userId ? f.receiverId : f.senderId);
    const friends = await db.collection('userCollection').find(
        { _id: { $in: friendsId.map(id => new ObjectId(id)) } },
        { projection :{password:0}},
    ).toArray();

    const userMap = {};
    friends.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    const orderedFriends = friendsId.map(id => userMap[id]);
    
    const nextCursor = friendsList.length === limit ? friendsList[friendsList.length -1]._id : null

    res.send({friends:orderedFriends,nextCursor})
   
  } catch (error) {
    console.log(error);
    res.status(500).send('server error')
  }
})




module.exports = router;