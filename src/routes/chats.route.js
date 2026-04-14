const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const router = express.Router();

// do you chat with who user
router.get('/chat-user/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    if (!id) {
      return res.status(400).send({message:'id is missing'})
    }
    const query = { _id: new ObjectId(id) };
    const result = await db.collection('userCollection').findOne(query, { projection: { password: 0 } });
    res.send(result);
  } catch (error) {
    console.log(error)
    res.status(500).send({message:'server error'})
  }
})

// get message 
router.get('/messages', async (req, res) => {
 try {
   const db = getDB();
   const { senderId, receiverId } = req.query;
   if (!senderId || !receiverId) {
     return res.status(400).send({ message: 'senderId & receiverId required' });
   }
   const query = {
     isRequest: false,
     $or: [
       { senderId: senderId, receiverId: receiverId },
       { senderId: receiverId, receiverId: senderId },
     ],
   };
   const result = await db.collection('messages').find(query).sort({ createdAt: 1 }).toArray();
   res.send(result);
 } catch (error) {
   console.log(error);
   res.status(500).send({ message: 'server error' });
 }
})

// When a user starts chatting with someone, that person should be added to the chat list

router.get('/chat-list', async (req, res) => {
  try {
     const db = getDB();
     const { userId } = req.query;
     if (!userId) {
       return res.status(400).send({ message: 'id is missing' });
     }
     const query = {
       isRequest: false,
       $or: [{ senderId: userId }, { receiverId: userId }],
     };
     const messages = await db.collection('messages').find(query).sort({createdAt:-1}).toArray();
     if (messages.length === 0) {
       return res.send([]);
    }
   
     const findMessageId = [
       ...new Set(
         messages.map(m => (m.senderId === userId ? m.receiverId : m.senderId)),
       ),
    ];
    
    
    
     const secondQuery = {
       _id: { $in: findMessageId.map(id => new ObjectId(id)) },
     };
    const users = await db.collection('userCollection').find(secondQuery, { projection: { password: 0 } }).toArray();
    
    const chatList = users.map((user) => {
      const lastText = messages.find(m => (m.senderId === userId && m.receiverId === user._id.toString()) || (m.senderId === user._id.toString() && m.receiverId === userId));
      return {
        ...user,
        lastMessage: lastText?.message,
        lastSeen:lastText?.createdAt
      }
    })

    res.send(chatList);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
})


// send message  and message request
router.post('/send-message', async (req, res) => {
  try {
    const db = getDB();
   const { senderId, receiverId,message} = req.body;
   if (!senderId || !receiverId) {
     return res.status(400).send({ message: 'body is missing' });
    }
     if (!message) {
       return res.status(400).send({ message: 'message is required' });
     }
    
    const query = { $or: [{ senderId:senderId,receiverId:receiverId},{senderId:receiverId,receiverId:senderId}] };
    const friend = await db.collection('friendRequests').findOne(query)
    let isRequest = true;
    if (friend?.status === 'accepted') {
      isRequest = false;
    }

    const newMessage = {
      senderId,
      receiverId,
      message,
      isRequest,
      seen:false,
      createdAt: new Date()
    };

    const result = await db.collection('messages').insertOne(newMessage);
    res.status(200).send(result)

 } catch (error) {
  console.log(error);
  res.status(500).send({ message: 'server error' });
 }
})



module.exports = router;