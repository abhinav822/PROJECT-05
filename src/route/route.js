const express = require('express');
const router = express.Router();
// const { Authentication, Authorization } = require('../MiddleWare/auth')
const { createUser, userLogin, getUserProfile} = require('../Controller/userController')
const {getProductById}=require('../Controller/productController')
const {authentication}=require("../middleware/middleware")


//===================== User Registration (Post API) =====================//
router.post("/register", createUser)

router.post("/login",userLogin)
router.get("/user/:userId/profile", authentication, getUserProfile)

// ======================Product APIs======================== 

router.get('/products/:productId',getProductById)


router.all("/**",  (req, res) => {
    return res.status(404).send({ status: false, msg: "API request not Available!"})
});
//<<<============================================================================>>>//

module.exports = router;