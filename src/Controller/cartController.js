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

        let cartExist = await cartModel.findOne({ _id: cId });  //checking if the cart is already present in the database

        if (cartExist) {
            if (cartExist.userId != uId) {
                return res.status(403).send({ status: false, message: "This cart does not belong to you. Please check the cart Id" })
            }
            let updateData = {}  //creating an empty object

            for (let i = 0; i < cartExist.items.length; i++) {
                if (cartExist.items[i].productId == pId) {

                    cartExist.items[i].quantity = (cartExist.items[i])['quantity'] + parseInt(data.quantity)

                    updateData['items'] = cartExist.items  //updating the items array 
                    const productPrice = await productModel.findOne({ _id: pId, isDeleted: false }).select({ price: 1, _id: 0 })

                    nPrice = productPrice.price;  //getting the price of the product

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
            if (!productPrice) { return res.status(404).send({ status: false, mesaage: `Product not found or Deleted with this ${pId}` }) }
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
        return res.status(204).send()  // 204 will not send any data in response  

    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}



exports.updateCart = async function (req, res) {
    try {
        const userId = req.params.userId  //getting the user id from the path params
        const { cartId, productId, removeProduct } = req.body  //getting the cart id, product id and remove product from the body

        if (Object.keys(userId) == 0) { return res.status(400).send({ status: false, message: "Please provide user id in path params" }) }

        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid User Id" }) }

        if (!isValid(cartId)) { return res.status(400).send({ status: true, message: "Please provide cart id in body" }) }

        if (!isValidObjectId(cartId)) { return res.status(400).send({ status: false, message: "Please provide a valid Cart Id" }) }

        if (!isValid(productId)) { return res.status(400).send({ status: true, message: "Please provide cart id in body" }) }

        if (!isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "Please provide a valid Product Id" }) }

        if (!isValid(removeProduct)) { return res.status(400).send({ status: true, message: "Please provide cart id in body" }) }


        let cart = await cartModel.findById({ _id: cartId })  //finding the cart
        if (!cart) {
            return res.status(404).send({ status: false, msg: "Cart not found" })
        }
        if (cart.totalPrice == 0 && cart.totalItems == 0) {  //checking if the cart is empty
            return res.status(400).send({ status: false, msg: "Cart is empty" })  //sending a bad request
        }
        let user = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!user) {
            return res.status(404).send({ status: false, msg: "User not found" })
        }
        let cartMatch = await cartModel.findOne({ userId: userId })
        if (!cartMatch) {
            return res.status(401).send({ status: false, message: "This cart does not belong to you. Please check the input" })
        }
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, msg: "Product not found" })
        }

        if (removeProduct == 0) {
            for (let i = 0; i < cart.items.length; i++) {  //looping through the items array
                if (cart.items[i].productId == productId) {  //checking if the product id is present in the items array
                    const productPrice = product.price * cart.items[i].quantity  //getting the price of the product
                    const updatePrice = cart.totalPrice - productPrice  //updating the price of the cart
                    cart.items.splice(i, 1)    //removing the product from the items array splice operator works like for example if we have an array [1,2,3,4,5] and we want to remove 3 from the array then we can use splice(2,1) which will remove 3 from the array and if we write splice(2,2) then it will remove 3 and 4 from the array brcause we have given 2 as the second parameter and first parameter is the index of the array from where we want to remove the elements
                    const updateItems = cart.totalItems - 1  //updating the total items in the cart
                    const updateItemsAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems }, { new: true })  //updating the cart
                    return res.status(200).send({ status: true, msg: "Succesfully Updated in the cart", data: updateItemsAndPrice })
                }

            }
        } else if (removeProduct == 1) {  //if the remove product is 1 
            for (let i = 0; i < cart.items.length; i++) {  //looping through the items array
                if (cart.items[i].productId == productId) {  //checking if the product id is present in the items array
                    const updateQuantity = cart.items[i].quantity - 1  //updating the quantity of the product
                    if (updateQuantity < 1) {  //if update quantity is less than 1 then remove the product from the cart for example if the quantity is 1 and we want to remove 1 product then the quantity will be 0 and we have to remove the product from the cart
                        const updateItems = cart.totalItems - 1  //updating the total items in the cart
                        const productPrice = product.price * cart.items[i].quantity  //getting the price of the product and multiplying it with the quantity for example if the price of the product is 100 and the quantity is 2 then the price will be 200
                        const updatePrice = cart.totalPrice - productPrice  //updating the price of the cart
                        cart.items.splice(i, 1)  //removing the product from the items array

                        const updateItemsAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems }, { new: true })
                        return res.status(200).send({ status: true, msg: "Product has been removed successfully from the cart", data: updateItemsAndPrice })

                    } else {
                        cart.items[i].quantity = updateQuantity  //else condition if the quantity is greater than 1 then update the quantity
                        const updatedPrice = cart.totalPrice - (product.price * 1)  //updating the price of the cart
                        const updatedQuantityAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatedPrice }, { new: true })
                        return res.status(200).send({ status: true, msg: "Quantity has been updated successfully in the cart", data: updatedQuantityAndPrice })
                    }
                }
            }
        }

    } catch (error) {
        res.status(500).send({ status: false, msg: error.msg })
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
        if (!cartDbForUser) return res.status(404).send({ status: false, messgage: `Cart with ID: <${cartId}> of User: <${userId}> not found in Database` })

        if (cartDbForUser.items.length === 0) {
            return res.status(404).send({ status: false, message: ` NO products in cart with ID: <${cartId}>` });
        }

        let productDb = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDb) return res.status(404).send({ status: false, messgage: 'product not found' })

        let cartDbForProduct = await cartModel.findOne({ userId: userId, "items.productId": productId })
        if (!cartDbForProduct) return res.status(404).send({ status: false, messgage: `Product with ID: <${productId}> Not found in User's Cart` })

        const numProductInCart = cartDbForProduct.items.filter((x) => x.productId == productId)

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
                $inc: {
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

