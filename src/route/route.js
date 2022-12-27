const express = require('express');
const router = express.Router();

const {authentication, authorization} = require("../middleware/middleware")

const { createUser, userLogin, getUserProfile,updateUser} = require('../Controller/userController')

const {createProducts, getProductById , getProduct,updateProducts, deleteProduct} = require('../Controller/productController')

const {createCart,getCart,deleteCart, updateCart} = require('../Controller/cartController')

const { updateOrder , createOrder} = require('../Controller/orderController')



//===================== User API =====================//

router.post("/register", createUser)

router.post("/login",userLogin)

router.get("/user/:userId/profile", authentication, getUserProfile)

router.put("/user/:userId/profile", authentication,authorization, updateUser)

// ====================== Product APIs ======================== 

router.post("/products", createProducts)

router.get('/products/:productId',getProductById)

router.get('/products',getProduct)

router.put('/products/:productId', updateProducts)

router.delete("/products/:productId", deleteProduct)



//<<<===================== CART's APIs =====================>>>//
router.post("/users/:userId/cart", authentication, authorization, createCart)

router.get("/users/:userId/cart", authentication, authorization, getCart)

router.delete("/users/:userId/cart", authentication, authorization, deleteCart)

router.put("/users/:userId/cart", authentication, authorization, updateCart)

//<<<===================== Order's APIs =====================>>>//

router.post("/users/:userId/orders", authentication, authorization, createOrder)

router.put("/users/:userId/orders", authentication, authorization, updateOrder)




router.all("/**",  (req, res) => {
    return res.status(404).send({ status: false, msg: "API request not Available!"})
});
//<<<============================================================================>>>//

module.exports = router;