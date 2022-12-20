const express = require('express');
const router = express.Router();
// const { Authentication, Authorization } = require('../MiddleWare/auth')
const { createUser,userLogin} = require('../Controller/userController')


//===================== User Registration (Post API) =====================//
router.post("/register", createUser)

router.post("/login",userLogin)


router.all("/**",  (req, res) => {
    return res.status(404).send({ status: false, msg: "API request not Available!"})
});
//<<<============================================================================>>>//

module.exports = router;