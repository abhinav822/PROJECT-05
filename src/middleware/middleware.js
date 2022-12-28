const jwt = require('jsonwebtoken')
const userModel = require('../model/userModel')
const { isValidObjectId } = require('../validations/validator')

exports.authentication = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(400).send({
        status: false,
        message: `Missing authentication token in request`,
      });
    }
    let splitToken = token.split(" ");

    jwt.verify(
      splitToken[1],
      "secretKey",
      (err, decodedToken) => {
        if (err) {
          return res.status(401).send({ status: false, message: err.message });
        }
        req.decodedToken = decodedToken;  // decodedToken is the payload
        next();
      }
    );
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

exports.authorization = async (req, res, next) => {

  try {

    //===================== Authorising with userId From Param =====================//
    let userId = req.params.userId

    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: `This UserId: ${userId} is not valid!` })

    //===================== Fetching All User Data from DB =====================//
    let userData = await userModel.findById(userId)
    if (!userData) return res.status(404).send({ status: false, message: "User Does Not Exist" })

    //x===================== Checking the userId is Authorized Person or Not =====================x//
    if (userData['_id'].toString() !== req.decodedToken.userId) {
      return res.status(403).send({ status: false, message: "Unauthorized User Access!" })  // getting error payload is not defined to fix this error we need to add this line in auth.js file in middleware folder 
    }

    next()

  } catch (error) {

    res.status(500).send({ status: false, error: error.message })
  }
}