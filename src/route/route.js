const express = require('express');
const router = express.Router();
// const { Authentication, Authorization } = require('../MiddleWare/auth')
const { createUser, userLogin, getUserProfile} = require('../Controller/userController')
const {authentication}=require("../middleware/middleware")


//===================== User Registration (Post API) =====================//
router.post("/register", createUser)
router.post("/login",userLogin)
router.get("/user/:userId/profile", authentication, getUserProfile)

module.exports = router;