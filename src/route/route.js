const express = require('express');
const router = express.Router();
// const { Authentication, Authorization } = require('../MiddleWare/auth')
const { createUser, userLogin, getUserProfile, updateUser} = require('../Controller/userController')
const {authentication, authorization}=require("../middleware/middleware")


//===================== User Registration (Post API) =====================//
router.post("/register", createUser)

router.post("/login",userLogin)
router.get("/user/:userId/profile", authentication, getUserProfile)
router.put("/user/:userId/profile", authentication,authorization, updateUser)


router.all("/**",  (req, res) => {
    return res.status(404).send({ status: false, msg: "API request not Available!"})
});
//<<<============================================================================>>>//

module.exports = router;