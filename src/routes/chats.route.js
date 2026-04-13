const express = require('express');
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const router = express.Router();

router.get('/chat-user/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    if (!id) {
      return res.send(400).send({message:'id is missing'})
    }
    const query = { _id: new ObjectId(id) };
    const result = await db
      .collection('userCollection')
      .findOne(query, { projection: { password: 0 } });
    res.send(result);
  } catch (error) {
    console.log(error)
    res.status(500).send({message:'server error'})
  }
})



module.exports = router;