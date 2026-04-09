const express = require('express');
const { getDB } = require('../db');
const router = express.Router();
const bcrypt = require("bcryptjs");

// login 
router.post('/login', async (req, res) => {
  try {
    const db = getDB();
    const { password, email } = req.body;
    if (!email) {
      return res.send({ message: 'Email is required' });
    }
    if (!password) {
      return res.send({ message: 'password is required' });
    }

    const query = { email: email };
    const user = await db.collection('userCollection').findOne(query);
    if (!user) {
      return res.status(401).send({ message: 'user not exists' });
    }
    if (!user.password) {
      return res.status(404).send({ message: 'password not found' });
    }
    const cmpPassword = await bcrypt.compare(password, user.password);
    if (!cmpPassword) {
      return res.send({ message: 'wrong password' });
    }
    const newData = {
      userId:user?._id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      authProvider: user.authProvider,
      createAt: user.createAt,
    };
    res.send(newData);

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'server error' });
  }


})

// login for google
router.post('/google', async (req, res) => {
  try {
    const db=getDB()
    const body = req.body;
    if (!body.email) {
      return res.send({ message: 'plz give your email' });
    }
    const query = { email: body.email };
    const user = await db.collection('userCollection').findOne(query)
    if (user) {
        return res.send({id:user?._id,role:user?.role});
      }
    const newUser = {
      email: body.email,
      name: body.name,
      image: body.image,
      role: 'user',
      authProvider:body.authProvider,
      createAt: new Date(),
    };
    const result = await db.collection('userCollection').insertOne(newUser)
    
    res.send({id: result?.insertedId,role:'user' });
    

   
  } catch (error) {
    console.log(error)
    res.status(500).send({message:'server error'})
  }
})
// register
router.post('/register', async (req, res) => {
  try {
    const db=getDB()
    const body = req.body;
    if (!body.email) {
      return res.send({ message: 'plz give your email' });
    }
    if (!body.password) {
      return res.send({ message: 'plz give password' });
    }
    const query = { email: body.email };
    const user = await db.collection('userCollection').findOne(query)
    if (user) {
        return res.send({ message: 'User already exists' });
      }
    const hashedPassword = await bcrypt.hash(body.password, 12);

    const newUser = {
      email: body.email,
      password: hashedPassword,
      name: body.name,
      image: body.image,
      role: 'user',
      authProvider:body.authProvider,
      createAt: new Date(),
    };
    const result = await db.collection('userCollection').insertOne(newUser)
    res.send(result);
  } catch (error) {
    console.log(error)
    res.status(500).send({message:'server error'})
  }
})




module.exports = router;