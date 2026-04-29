const jwt = require('jsonwebtoken');

 const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).send({ message: 'unAuthorized' });
      return;
    }

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
          res.status(403).send({ message: 'forBiden access' });
          return;
        }
        req.user = user;
        next();
      });
    }
    

  } catch (error) {
    console.log(error)
    res.status(500).send({message:'server error'})
  }
};

module.exports = { verifyJWT };