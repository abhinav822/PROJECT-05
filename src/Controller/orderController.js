const { isValidPrice, isValidNum, isValidateSize, isValidImage, isValid, isValidName, isValidObjectId, isValidRequestBody } = require('../validations/validator')

const cartModel = require("../model/cartModel")
const orderModel = require("../model/orderModel")
const userModel = require("../model/userModel")




exports.updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body

        const { orderId, status } = data

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "plese enter data in request body" })
        }
        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please enter valid userId!" }) }

        let check = await userModel.findById(userId)
        if (!check) {
            return res.status(404).send({ status: false, message: "user is not found for this userId" })
        }
        if (!isValid(orderId)) return res.status(400).send({ status: false, message: "Please enter orderId!" })

        if (!isValidObjectId(orderId)) { return res.status(400).send({ status: false, message: "Please enter valid orderId!" }) }

        const OrderFind = await orderModel.findById(orderId)
        if (!OrderFind) { return res.status(404).send({ status: false, message: "Please enter valid orderId!" }) }

        const orderMatch = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!orderMatch) return res.status(404).send({ status: false, message: `No order found with this id ${orderId}` })

        if (!isValid(status)) { return res.status(400).send({ status: false, message: "status must be parsent" }) }

        if (status) {
            if (!["pending", "completed", "cancelled"].includes(status)) {
                return res.status(400).send({ status: false, message: "status must be ['completed', 'cancelled', 'pending']" })
            }
        }

        if (status === "pending") {
            if (OrderFind.status === "completed") {
                return res.status(400).send({ status: false, message: "order Can't be Updated to pending because it is completed" })
            }
            if (OrderFind.status === "cancelled") {
                return res.status(400).send({ status: false, message: "order Can't be Updated to pending because it is cancelled" })
            }
            if (OrderFind.status === "pending") {
                return res.status(400).send({ status: false, message: "order is already pending" })
            }
        }
        if (status === "completed") {
            if (OrderFind.status === "cancelled") {
                return res.status(400).send({ status: false, message: "order Can't be Updated to completed because it is cancelled" })
            }
            if (OrderFind.status === "completed") {
                return res.status(400).send({ status: false, message: "order is already completed" })
            }

            let orderCheck = await orderModel.findByIdAndUpdate({ _id: orderId, userId: userId }, { status: status }, { new: true })

            return res.status(200).send({ status: true, message: "sucess", data: orderCheck })
        }

        if (status === "cancelled") {
            if (OrderFind.cancellable === false) {
                return res.status(400).send({ status: false, message: "item can't be cancelled because not cancellable" })
            }

            if (OrderFind.status === "cancelled") {
                return res.status(400).send({ status: false, message: "order is already cancelled" })
            }


            let orderCheckAfter = await orderModel.findByIdAndUpdate({ _id: orderId, userId: userId }, { status: status }, { new: true })

            return res.status(200).send({ status: true, message: "sucess", data: orderCheckAfter })

        }
    }
    catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}


exports.createOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let { cartId, status, cancellable } = data;

        if (!isValid(userId)) return res.status(400).send({ status: false, message: "Please provide userId in Url" })

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid userId in Url" })

        const findUser = await userModel.findById(userId)
        if (!findUser) return res.status(400).send({ status: false, message: "User doesn't exist" })

        if (!isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        //=============================== cartid validation =====================================
        if (!cartId) {
            return res.status(400).send({ status: false, message: "Cart ID is mandatory" });
        }
        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Cart ID is missing" });
        }
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Please provide valid format of cart Id" });
        }
        //============================ checking if the cart exist from the userid ======================  
        let findingCart = await cartModel.findOne({ userId: userId });
        if (req.body.cartId != findingCart._id) { return res.status(404).send({ status: false, message: "cartId missMatches" }) }
        if (!findingCart)
            return res.status(404).send({ status: false, message: `No cart exist for ${userId}` });
        //========================= if cart exist but cart is empty =====================================
        if (findingCart.items.length === 0)
            return res.status(400).send({ status: false, message: "Cart items are empty" });

            if (status) {
                if (!["pending", "completed", "cancelled"].includes(status)) {
                    return res.status(400).send({ status: false, message: "status must be ['pending', 'completed', 'cancelled']" })
                }
            }
        //=============================== if cancelleable is present in body =========================
        if (cancellable) {
            if (!isValid(cancellable))
                return res.status(400).send({ status: false, message: "cancellable should not contain blank spaces" });
            if (typeof cancellable == 'string') {  
                cancellable = cancellable.toLowerCase().trim();
                if (cancellable == 'true' || cancellable == 'false') {
                    cancellable = JSON.parse(cancellable) // we are parsing it because we want to store it as boolean in db and if we don't parse it then it will store as string 
                } else {
                    return res.status(400).send({ status: false, message: "Please enter 'true' or 'false'" });
                }
            }
        }

        let totalQuantity = 0;
        for (let i = 0; i < findingCart.items.length; i++) {
            totalQuantity += findingCart.items[i].quantity;
        }

        data.userId = userId;
        data.items = findingCart.items;
        data.totalPrice = findingCart.totalPrice;
        data.totalItems = findingCart.totalItems;
        data.totalQuantity = totalQuantity;

        let result = await orderModel.create(data);
        if (result) { let cartUpdation = await cartModel.updateOne({ _id: findingCart._id }, { items: [], totalPrice: 0, totalItems: 0 }); }

        return res.status(201).send({ status: true, message: "Success", data: result })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


