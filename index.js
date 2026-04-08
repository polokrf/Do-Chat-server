require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/db'); //server connect
const port = process.env.PORT || 5000;

// mongodb connect

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log('Your server is running port : ', port);
    });
  } catch (error) {
    console.log(error);
  }
};
startServer();
