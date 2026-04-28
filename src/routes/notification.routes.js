
const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const router = express.Router();

router.get('', async (req, res) => {
  try {
    const db = getDB();
    const { userId, cursor } = req.query;
    if (!userId) {
      res.status(403).send({ message: 'not access' })
      return
    }
    const query = {
      $or: [
        { receiverId: userId, type: 'friend request', isRead: false },
        { receiverId: userId, type: 'accept friend request', isRead: false },
      ],
    };
    if (cursor) {
      query._id = { $lt: new ObjectId(cursor) };
    }
    let limit = 10;

    const result = await db.collection('notifications').find(query).sort({ _id: -1 }).limit(limit).toArray();
    const senderIds = result.map(noti => new ObjectId(noti.senderId));

    const nextCursor = result.length === limit ? result[result.length - 1]._id : null;
    const users = await db.collection('userCollection').find(
        { _id: { $in: senderIds} },
        { projection: { password: 0 } },
    ).toArray();
    
    res.send({ result, nextCursor ,users});
 
  
 } catch (error) {
    console.log(error);
    res.status(500).send({message:'server error'})
 }
})

// update notification status isRead false to true;
router.patch('/update-isRead', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.body;
    if (!id) {
      res.status(403).send({ message: 'not read without id' });
      return;
    }
    const query = { _id: new ObjectId(id) };
    const update = {
      $set: {
        isRead: true,
      },
    };
    const result = await db.collection('notifications').updateOne(query, update);
    res.send(result);
    
  } catch (error) {
    console.log(error);
    res.status(500).send({message:'server error'})
  }
 })


module.exports = router;