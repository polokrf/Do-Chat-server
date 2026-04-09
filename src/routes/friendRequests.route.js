const express = require('express');
const { getDB } = require('../db');
const router = express.Router();

// send friend requests
router.post('/', async (req, res) => {
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

   const result = await db.collection('friendRequests').insertOne(newRequest);
   res.send(result);

 } catch (error) {
   console.log(error);
   res.status(500).send({message:'server error'})
 }
})


module.exports = router;