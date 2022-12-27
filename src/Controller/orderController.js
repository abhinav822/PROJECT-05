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




