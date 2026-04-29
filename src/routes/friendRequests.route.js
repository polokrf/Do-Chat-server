const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const { verifyJWT } = require('../../middlewear');
const router = express.Router();


// get sender request
router.get('/senderRequest',verifyJWT, async (req, res) => {
 try {
   const db = getDB();
   const { userId } = req.query;
   const query = { senderId: userId, status: 'pending' };
   const result = await db.collection('friendRequests').find(query).toArray();
   res.send(result);
 } catch (error) {
   console.log(error)
   res.status(500).send({message:'server error'})
 }

})
// get Received request
router.get('/received',verifyJWT, async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.query;
    const query = { receiverId: userId, status: 'pending' };
    const result = await db.collection('friendRequests').find(query).toArray();
    res.send(result);
  } catch (error) {
     console.log(error);
     res.status(500).send({ message: 'server error' });
  }
});
// get friends 
router.get('/friends',verifyJWT, async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.query;
    const query = {
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status:'accepted'},
      ],
    };
    const result = await db.collection('friendRequests').find(query).toArray();
    res.send(result);
  } catch (error) {
     console.log(error);
     res.status(500).send({ message: 'server error' });
  }
});

// send friend requests
router.post('/',verifyJWT, async (req, res) => {
 try {
   const db = getDB();
   const { senderId: userId, receiverId: id } = req.body;
  
   if (!userId || !id) {
     return res.status(400).send({ message: 'id messing' });
   }
   
   if (userId === id) {
     return res.status(400).send({ message: 'You can not send request to yourself' });
   }
   const query = {
     $or: [
       { senderId: userId, receiverId: id },
       { senderId: id, receiverId: userId },
     ],
   };
   const requestFnd = await db.collection('friendRequests').findOne(query);
   if (requestFnd) {
     return res.status(400).send({ message: 'already send request' });
   }
    
   const newRequest = {
     senderId: userId,
     receiverId: id,
     status: 'pending',
   };

   const newNotifications = {
     senderId: userId,
     receiverId:id,
     type:'friend request',
     isRead: false,
     url: `/dashboard?tab=requests`,
     message: 'sent a new friend Request',
     createdAt: new Date(),
   };

   const result = await db.collection('friendRequests').insertOne(newRequest);
   const notifications = await db.collection('notifications').insertOne(newNotifications)
   res.send(result);

 } catch (error) {
   console.log(error);
   res.status(500).send({message:'server error'})
 }
})

// we  want to accept friend request
router.patch('/accept', verifyJWT, async (req, res) => {
  try {
    const db = getDB();
    const { userId, targetId } = req.body;
    if (!userId || !targetId) {
      return res.status(400).send({ message: 'Missing id' });
    }
    const query = {senderId: targetId,receiverId:userId,status:'pending'};
    const update = {
      $set: {
        status: 'accepted',
      },
    };
    const result = await db.collection('friendRequests').updateOne(query, update);
    const scQuery = {
      isRequest: true,
      $or: [
        { senderId: userId, receiverId: targetId },
        { senderId: targetId, receiverId: userId },
      ],
    };
    const scUpdate = {
      $set: {
        isRequest:false,
      }
    }
    const messRequestUpdate = await db.collection('messages').updateMany(scQuery, scUpdate)
    const newNotifications = {
      senderId: userId,
      receiverId: targetId,
      isRead: false,
      type:'accept friend request',
      url:`/dashboard?tab=friends`,
      message: 'accept a friend Request',
      createdAt: new Date(),
    };
    const notifications = await db.collection('notifications').insertOne(newNotifications);
    res.send(result);
  } catch (error) {
    
  }
})

// friend request delete cancel unfriend
router.delete('/delete', async (req, res) => {
  try {
    const db = getDB();
    const { targetId } = req.query;
    const query = {  $or:[{ senderId: targetId},{receiverId: targetId}] };
    const result = await db.collection('friendRequests').deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: 'server error' })
  }

});




module.exports = router;