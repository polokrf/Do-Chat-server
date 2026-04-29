const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const { verifyJWT } = require('../../middlewear');
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
    const { senderId, receiverId, cursor } = req.query;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .send({ message: 'senderId & receiverId required' });
    }

    const limit = 15;

    const query = {
      $or: [
        { senderId, receiverId },
        {
          senderId: receiverId,
          receiverId: senderId,
          isRequest: false,
        },
      ],
    };

    if (cursor) {
      query._id = { $lt: new ObjectId(cursor) };
    }

    const messages = await db.collection('messages').find(query).sort({ _id: -1 }).limit(limit)
      .toArray();

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1]._id : null;

    res.send({
      messages: messages.reverse(),
      nextCursor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
});

// When a user starts chatting with someone, that person should be added to the chat list

router.get('/chat-list', verifyJWT, async (req, res) => {
  try {
    const db = getDB();
    const { userId, cursor } = req.query;

    if (!userId) {
      return res.status(400).send({ message: 'id is missing' });
    }

    const limit = 10;

    const query = {
      $or: [{ senderId: userId }, { receiverId: userId, isRequest: false }],
      
    };
     if (cursor) {
       query._id = { $lt: new ObjectId(cursor) };
     }

    const messages = await db.collection('messages').find(query).sort({ createdAt: -1 }).toArray();

    // unique conversation map
    const conversationMap = new Map();

    for (const msg of messages) {
      const otherUserId =msg.senderId === userId ? msg.receiverId : msg.senderId;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, msg);
      }
    }

    const uniqueChats = Array.from(conversationMap.values()).slice(0, limit);

    const userIds = uniqueChats.map(msg =>
      msg.senderId === userId ? msg.receiverId : msg.senderId,
    );

    const users = await db.collection('userCollection')
      .find(
        { _id: { $in: userIds.map(id => new ObjectId(id)) } },
        { projection: { password: 0 } },
      )
      .toArray();

    const userMap = new Map(users.map(user => [user._id.toString(), user]));

    const chatList = uniqueChats.map(msg => {
      const otherUserId =
        msg.senderId === userId ? msg.receiverId : msg.senderId;

      return {
        ...userMap.get(otherUserId),
        lastMessage: msg.message,
        lastSeen: msg.createdAt,
      };
    });

    const nextCursor =uniqueChats.length === limit ? uniqueChats[uniqueChats.length - 1].createdAt : null;

    res.send({
      usersChat: chatList,
      nextCursor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
});

// message request list

router.get('/message-request-list',verifyJWT, async (req, res) => {
  try {
    const db = getDB();
    const { userId,cursor } = req.query;
    if (!userId) {
      return res.status(400).send({ message: 'id is missing' });
    }
    const limit =6
    const query = {
      $or: [{ receiverId: userId, isRequest: true }]
    };
     if (cursor) {
       query._id = { $lt: new ObjectId(cursor) };
     }
    const isMessageRequest = await db.collection('messages').find(query).sort({createdAt: -1}).limit(limit).toArray();
     if (isMessageRequest.length === 0) {
       return res.send([]);
     }
    const RequesterId = isMessageRequest.map(r => r.senderId);

    const sedQuery={_id:{$in:RequesterId.map(id=> new ObjectId(id))}}

    const isRequesterUsers = await db.collection('userCollection').find(sedQuery, { projection: { password: 0 } }).toArray()

    const users = isRequesterUsers.map(user => {
      const  userMessages = isMessageRequest.filter(meg => meg.senderId === user._id.toString() && meg.isRequest === true);
      const lastMessage = userMessages[0];
      return {
        ...user,
        lastMessage: lastMessage.message,
        lastSeen:lastMessage?.createdAt
      }
    })

     const nextCursor = isMessageRequest.length === limit ? isMessageRequest[isMessageRequest.length - 1]._id : null;
    res.send({users,nextCursor})
    
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
})



// send message  and message request
router.post('/send-message',verifyJWT, async (req, res) => {
  try {
    const db = getDB();
   const { senderId, receiverId,message} = req.body;
   if (!senderId || !receiverId) {
     return res.status(400).send({ message: 'body is missing' });
    }
     if (!message) {
       return res.status(400).send({ message: 'message is required' });
     }
    
    const query = {status:'accepted', $or: [{ senderId:senderId,receiverId:receiverId},{senderId:receiverId,receiverId:senderId}] };
    const friend = await db.collection('friendRequests').findOne(query);
    // already accept message request yes or no  check 
    const existingChatCount = await db.collection('messages').countDocuments({
      $or: [
        { senderId, receiverId, isRequest: false },
        { senderId: receiverId, receiverId: senderId, isRequest: false },
      ],
    });
     const existingChat = existingChatCount > 0;
    let isRequest = true;
   if (friend || existingChat) {
      isRequest = false;
    }

    const newMessage = {
      senderId,
      receiverId,
      message,
      isRequest,
      status:'sent',
      createdAt: new Date()
    };

    const result = await db.collection('messages').insertOne(newMessage);
    res.status(200).send({ ...newMessage, _id: result.insertedId });

 } catch (error) {
  console.log(error);
  res.status(500).send({ message: 'server error' });
 }
})


// message request accept or delete 
router.patch('/accept-delete',verifyJWT, async (req, res) => {
  try {
    const db = getDB();
    const { userId, requestId, action } = req.body;
    const query = {
      isRequest: true,
      $or: [
        { senderId: userId, receiverId: requestId },
        { senderId: requestId, receiverId: userId }
      ]
    };
    
    if (action === 'accept') {
      const update = {
        $set: {
          isRequest:false
        }
      }
       const updateMegReq = await db.collection('messages').updateMany(query, update);
       return res.send(updateMegReq);
     
    };

    if (action === 'delete') {
     const deleteMegReq = await db.collection('messages').deleteMany(query);
     return  res.send(deleteMegReq);
    }
    
     res.status(400).send({ message: 'Invalid action' });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
});




module.exports = router;