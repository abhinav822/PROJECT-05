const express = require('express');
const router = express.Router();
// const { Authentication, Authorization } = require('../MiddleWare/auth')
const { createUser} = require('../Controller/userController')


//===================== User Registration (Post API) =====================//
router.post("/register", createUser)

module.exports = router;