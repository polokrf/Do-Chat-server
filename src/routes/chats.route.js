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
   const { senderId, receiverId,cursor } = req.query;
   if (!senderId || !receiverId) {
     return res.status(400).send({ message: 'senderId & receiverId required' });
   }
  
   let limit = 15
   const query = {
     $and: [
       {
         $or: [
           { senderId: senderId, receiverId: receiverId },
           { senderId: receiverId, receiverId: senderId, isRequest: false },
         ],
       },
       cursor ? { _id: { $lt: new ObjectId(cursor) } } : {},
     ],
   };
   
   const messages = await db.collection('messages').find(query).sort({ createdAt: -1 }).limit(limit).toArray();
   const nextCursor = messages.length === limit ? messages[messages.length - 1]._id : null;
   res.send({
     messages:messages.reverse(),
     nextCursor
   });
 } catch (error) {
   console.log(error);
   res.status(500).send({ message: 'server error' });
 }
})

// When a user starts chatting with someone, that person should be added to the chat list

router.get('/chat-list', async (req, res) => {
  try {
    const db = getDB();
    const { userId,cursor } = req.query;
    if (!userId) {
      return res.status(400).send({ message: 'id is missing' });
    }
    const query = {
      $and: [
        {
          $or: [{ senderId: userId }, { receiverId: userId, isRequest: false }],
        },
        cursor ? {_id:{$lt:new ObjectId(cursor)}} : {}
      ],
    };
    const messages = await db.collection('messages').find(query).sort({ createdAt: -1 }).toArray();
    if (messages.length === 0) {
      return res.send({usersChat:[],nextCursor:null});
    }
   
    const findMessageId = [
      ...new Set(
        messages.map(m => (m.senderId === userId ? m.receiverId : m.senderId)),
      ),
    ];
    
    
    const limit = 10;
    const secondQuery = {
      _id: { $in: findMessageId.map(id => new ObjectId(id)) },
    };
    const users = await db.collection('userCollection').find(secondQuery, { projection: { password: 0 } }).sort({createAt: -1}).limit(limit).toArray();
    
    const chatList = users.map((user) => {
      const userMessages = messages.filter(m => (m.senderId === userId && m.receiverId === user._id.toString()) || (m.senderId === user._id.toString() && m.receiverId === userId));
      const lastText = userMessages[0];
      return {
        ...user,
        lastMessage: lastText?.message,
        lastSeen: lastText?.createdAt
      }
    })
    

    const nextCursor = users.length === limit ? users[users.length -1]._id:null
      


    res.send({usersChat:chatList,nextCursor});
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }
});

// message request list

router.get('/message-request-list', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).send({ message: 'id is missing' });
    }
    const query = {receiverId: userId ,isRequest:true};
    const isFriendRequest = await db.collection('messages').find(query).sort({createdAt: -1}).toArray();
     if (isFriendRequest.length === 0) {
       return res.send([]);
     }
    const RequesterId = isFriendRequest.map(r => r.senderId);

    const sedQuery={_id:{$in:RequesterId.map(id=> new ObjectId(id))}}

    const isRequesterUsers = await db.collection('userCollection').find(sedQuery, { projection: { password: 0 } }).toArray()

    const users = isRequesterUsers.map(user => {
      const  userMessages = isFriendRequest.filter(meg => meg.senderId === user._id.toString() && meg.isRequest === true);
      const lastMessage = userMessages[0];
      return {
        ...user,
        lastMessage: lastMessage.message,
        lastSeen:lastMessage?.createdAt
      }
    })
    res.send(users)
    
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
      seen:false,
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
router.patch('/accept-delete', async (req, res) => {
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