const jwt=require('jsonwebtoken')
const userModel= require('../model/userModel')
const {isValidObjectId} = require('../validations/validator')

exports. authentication = async (req, res, next) => {
    try {
      const token = req.headers["x-api-key"]; 
      if (!token) {
        return res
          .status(400)
          .send({ status: false, message: "Token must be present." });
      }
  
      jwt.verify(
        token,
        "secretKey",
        (err, decodedToken) => {
          if (err) {
            return res.status(401).send({ status: false, message: err.message });
          }
          req.decodedToken = decodedToken;
          next();
        }
      );
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };