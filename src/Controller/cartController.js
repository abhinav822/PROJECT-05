const { isValidPrice, isValidNum, isValidateSize, isValidImage, isValid, isValidName, isValidObjectId, isValidRequestBody } = require('../validations/validator')
const productModel = require('../model/productModel')
const cartModel = require('../model/cartModel')
const userModel = require('../model/userModel')


exports.createCart = async (req, res) => {
    try {
        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: "Please provide input " }) }

        let cId = data.cartId;
        let pId = data.productId;
        let uId = req.params.userId;

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "No data found from body! You need to put Something(i.e. cartId, productId)." });

        if (!isValid(pId)) return res.status(400).send({ status: false, message: "Enter ProductId." })
        if (!isValidObjectId(pId)) return res.status(400).send({ status: false, message: `This ProductId: ${pId} is not valid!` })

        let checkProduct = await productModel.findOne({ _id: pId, isDeleted: false })
        if (!checkProduct) { return res.status(404).send({ status: false, message: `This ProductId: ${pId} is not exist!` }) }

        if (!cId) {
            let cartExistforUser = await cartModel.findOne({ userId: uId })
            if (cartExistforUser) {
                return res.status(400).send({ status: false, message: "Cart already exist for this user. PLease provide cart Id or delete the existing cart" })
            }
        }

        if (!pId) { return res.status(400).send({ status: false, message: "Please provide Product Id " }) }


        if (Object.keys(uId) == 0) { return res.status(400).send({ status: false, message: "Please provide User Id " }) }

        let userExist = await userModel.findOne({ _id: uId });
        if (!userExist) {
            return res.status(404).send({ status: false, message: `No user found with this ${uId}` })
        }

        if (cId) {
            if (!isValidObjectId(cId)) {
                return res.status(400).send({ status: false, message: "invalid cartId format" })
            }
            let cartExist = await cartModel.findById(cId)
            if (!cartExist) {
                return res.status(404).send({ status: false, message: "cart does not exist" })
            }
        }
        
        let cartExist = await cartModel.findOne({ _id: cId });  //checking if the cart is already present in the database


        if (cartExist) {
            if (cartExist.userId != uId) {
                return res.status(403).send({ status: false, message: "This cart does not belong to you. Please check the cart Id" })
            }
            let updateData = {}  //creating an empty object

            for (let i = 0; i < cartExist.items.length; i++) {  
                if (cartExist.items[i].productId == pId) {  

                    cartExist.items[i].quantity = (cartExist.items[i])['quantity'] + parseInt(data.quantity)  

                    updateData['items'] = cartExist.items   
                    const productPrice = await productModel.findOne({ _id: pId, isDeleted: false }).select({ price: 1, _id: 0 }) 
                    nPrice = productPrice.price;  

                    updateData['totalPrice'] = (cartExist.totalPrice) + parseInt(data.quantity * nPrice)  
                    updateData['totalItems'] = cartExist.items.length;  

                    const updatedCart = await cartModel.findOneAndUpdate({ _id: cId }, updateData, { new: true })  
                    return res.status(200).send({ status: true, message: "Updated Cart", data: updatedCart })  
                }
                //new product
                if (cartExist.items[i].productId !== pId && i == cartExist.items.length - 1) {  
                    const obj = { productId: pId, quantity: 1 }  
                    let arr = cartExist.items  
                    arr.push(obj)  
                    updateData['items'] = arr  

                    const productPrice = await productModel.findOne({ _id: pId, isDeleted: false }).select({ price: 1, _id: 0 })  
                    nPrice = productPrice.price  
                    updateData['totalPrice'] = cartExist.totalPrice + (nPrice * 1) 
                    updateData['totalItems'] = cartExist.items.length;

                    const updatedCart = await cartModel.findOneAndUpdate({ _id: cId }, updateData, { new: true })
                    return res.status(200).send({ status: true, message: "Updated Cart", data: updatedCart })
                }
            }

        }
        else {
            let newData = {}  
            let arr = []  
            newData.userId = uId; 

            const object = { productId: pId, quantity: 1 }  
            arr.push(object)  
            newData.items = arr;  

            const productPrice = await productModel.findOne({ _id: pId, isDeleted: false }).select({ price: 1, _id: 0 })  
            nPrice = productPrice.price;  
            newData.totalPrice = nPrice;  

            newData.totalItems = arr.length;  

            const newCart = await cartModel.create(newData)  

            return res.status(201).send({ status: true, message: "Cart details", data: newCart })


        }

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



exports.getCart = async function (req, res) {
    try {
        const userId = req.params.userId
        if (Object.keys(userId) == 0) {
            return res.status(400).send({ status: false, message: "userId is required" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }
        const getData = await cartModel.findOne({ userId: userId }).select({ _id: 0 })
        if (!getData) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }
        return res.status(200).send({ status: true, message: "cart details", data: getData })


    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}



exports.deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId
        if (Object.keys(userId) == 0) {
            return res.status(400).send({ status: false, message: "userId is required" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }
        const cartData = await cartModel.findOne({ userId: userId })
        if (!cartData) {
            return res.status(404).send({ status: false, message: "cart not found or delete existing cart" })
        }
        let cart = { totalItems: 0, totalPrice: 0, items: [] }
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, cart, { new: true })
        return res.status(204).send()  

    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}



exports.updateCart = async (req, res) => {
    try {

        let userId = req.params.userId.trim();

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId" })

        let { cartId, productId, removeProduct } = req.body

        if (!isValid(cartId)) return res.status(400).send({ status: false, message: "Please provide cartId" })
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId" })


        if (!isValid(productId)) return res.status(400).send({ status: false, message: "Please provide productId" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid productId" })

        if (!isValid(removeProduct)) return res.status(400).send({ status: false, message: "Please provide removeProduct" })
        if (!/^[0-1]$/.test(removeProduct)) return res.status(400).send({ status: false, message: "removeProduct can ONLY be 0 or 1" });

        let userDb = await userModel.findById(userId)  
        if (!userDb) return res.status(404).send({ status: false, messgage: 'user not found' })

        let cartDbForUser = await cartModel.findOne({ _id: cartId, userId: userId })
        if (!cartDbForUser) return res.status(404).send({ status: false, messgage: `Cart with ID: ${cartId} of User: ${userId} not found in Database` })

        if (cartDbForUser.items.length === 0) { 
            return res.status(404).send({ status: false, message: ` NO products in cart with ID: <${cartId}>` });
        }

        let productDb = await productModel.findOne({ _id: productId, isDeleted: false })  //checking if the product is present in the database
        if (!productDb) return res.status(404).send({ status: false, messgage: 'product not found' })

        let cartDbForProduct = await cartModel.findOne({ userId: userId, "items.productId": productId })
        if (!cartDbForProduct) return res.status(404).send({ status: false, messgage: `Product with ID: <${productId}> Not found in User's Cart` })

        const numProductInCart = cartDbForProduct.items.filter((x) => x.productId == productId)  //thsi will give the quantity of the product in the cart

        if (removeProduct == 0) {
            const removeProduct0 = await cartModel.findOneAndUpdate(
                {
                    _id: cartId,  
                    "items.productId": productId,  
                },
                {
                    $pull: { items: { productId: productId } },  
                    $inc: {
                        totalItems: -1,  
                        totalPrice: -productDb.price * numProductInCart[0].quantity,  
                    },
                },
                { new: true }
            );

            return res.status(200).send({ status: true, message: "Success", data: removeProduct0, });
        }

        else if (removeProduct == 1) {

            if (numProductInCart[0].quantity === 1) {  
                const removeProCart1 = await cartModel.findOneAndUpdate(
                    {
                        _id: cartId,  
                        "items.productId": productId 
                    },
                    {
                        $pull: { items: { productId: productId } }, 
                        $inc: {
                            totalItems: -1,  
                            totalPrice: -productDb.price * numProductInCart[0].quantity  
                        },
                    },
                    { new: true }
                );
                return res.status(200).send({ status: true, message: "Success", data: removeProCart1 });
            }
        }


        const reduceProductIfMore1 = await cartModel.findOneAndUpdate(
            {
                _id: cartId,  
                "items.productId": productId,  
            },
            {
                $inc: {    // why not $de
                    "items.$.quantity": -1,  
                    totalPrice: -productDb.price,  
                },
            },
            { new: true }
        );

        return res.status(200).send({ status: true, message: "Success", data: reduceProductIfMore1 });


    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

