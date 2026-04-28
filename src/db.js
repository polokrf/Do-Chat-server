// doChat
// Yn0MCuP1wNkvkpn6


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DBURl;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db

const connectDB = async()=> {
  try {
   await client.connect();
    db = client.db('chat-app');

    console.log('MongoDB connected!');
    await db.collection('userCollection').createIndex({ email: 1 }, { unique: true });
    await db.collection('notifications').createIndex(
      {
        senderId: 1,
        receiverId: 1,
        type: 1,
        isRead: 1,
      },
      {
        unique: true,
      },
    );

     
  }catch(error){
   console.log(error)
  }
}

const getDB = () => db;
module.exports = { connectDB, getDB };