const productModel = require('../model/productModel')
const uploadFile = require("../aws/config")
const { isValidPrice, isValidateSize, isValidImage, isValid, isValidName, isValidObjectId, isValidRequestBody } = require('../validations/validator')



exports.createProducts = async (req, res) => {
  try {
    let data = req.body
    let files = req.files

    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes } = data

    //===================== Checking User Body Data =====================//
    if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes" });

    //===================== Validation of Data =====================//

    if (!isValid(title)) { return res.status(400).send({ status: false, message: 'Please enter fname' }) }
    if (!isValidName(title)) { return res.status(400).send({ status: false, message: 'Please enter valid title' }) }

    if (!isValid(description)) { return res.status(400).send({ status: false, message: 'Please enter description' }) }
    if (!isValidName(description)) { return res.status(400).send({ status: false, message: 'Please enter valid description' }) }

    if (!isValid(price)) { return res.status(400).send({ status: false, message: 'Please enter the price' }) }
    if (!isValidPrice(price)) { return res.status(400).send({ status: false, message: 'Please enter valid price' }) }

    if (!isValid(currencyId)) { return res.status(400).send({ status: false, message: 'Please enter the currencyId' }) }
    if (currencyId) {
      if (currencyId != "INR") { return res.status(400).send({ status: false, message: 'Please enter valid currencyId' }) }
    }

    if (!isValid(currencyFormat)) { return res.status(400).send({ status: false, message: 'Please enter the currencyFormat' }) }
    if (currencyFormat) {
      if (currencyFormat != "₹") { return res.status(400).send({ status: false, message: "Please enter valid currencyFormat" }) }
    }

    // <isFreeShipping> default(false) Validation.
    if (isFreeShipping) {
      if (isFreeShipping != "true" && isFreeShipping != "false") {
        return res.status(400).send({ status: false, message: "isFreeShipping must be either true OR false." });
      }
    }

    if (!isValid(style)) { return res.status(400).send({ status: false, message: 'Please enter the style' }) }
    if (!isValidName(style)) { return res.status(400).send({ status: false, message: "Please enter valid style" }) }


    if (!isValid(availableSizes)) {
      return res.status(400).send({ status: false, message: "Please specify the sizes which are available" })
    }

    if (availableSizes) {
      let size = availableSizes.toUpperCase().split(",")
      data.availableSizes = size;


      for (let i = 0; i < size.length; i++) {
        if (!isValidateSize(size[i])) {
          return res.status(400).send({ status: false, message: "Size is not available" })
        }
      }
    }
    //----------------------------unique tittle------------------------------

    let uniqueTitle = await productModel.findOne({ title: title })
    if (uniqueTitle) { return res.status(400).send({ status: false, message: "Please provide unique title" }) }

    //------------------------------productImage------------------------------

    if (files && files.length > 0) {

      if (files.length > 1) return res.status(400).send({ status: false, message: "You can't enter more than one file for Create!" })
      if (!isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "You have to put only Image." }) }

      data.productImage = await uploadFile(files[0])
    }
    else {
      return res.status(400).send({ msg: "Please put image to create registration!" })
    }


    //-------------------------------create the product info------------------

    const createProduct = await productModel.create(data)

    return res.status(201).send({ status: true, message: "Product data is successfully created", data: createProduct })



  }
  catch (error) {
    return res.status(500).send({ status: false, error: error.message })
  }
}


exports.getProductById = async function (req, res) {
  try {
    let productId = req.params.productId

    if (!isValidObjectId(productId))
      return res.status(400).send({ status: false, message: "Please provide valid productId." })

    let product = await productModel.findOne({ _id: productId, isDeleted: false })

    if (!product) return res.status(404).send({ status: false, message: "Product Not found." })

    return res.status(200).send({ status: true, message: "Success", data: product })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }

}



exports.getProduct = async (req, res) => {

  try {

    let data = req.query

    //===================== Destructuring User Body Data =====================//
    let { size, name, priceGreaterThan, priceLessThan, priceSort, ...rest } = data

    //===================== Checking Mandotory Field =====================//
    if (isValidRequestBody(rest)) { return res.status(400).send({ status: false, message: "You can input only size, name, priceGreaterThan, priceLessThan, priceSort." }) }

    if (!isValidRequestBody(data)) {

      let productData = await productModel.find({ isDeleted: false })

      if (productData.length == 0) return res.status(404).send({ status: false, message: "Products not found" })

      return res.status(200).send({ status: true, message: "Success", data: productData });
    }

    //===================== Create a Object of Product =====================//
    let obj = { isDeleted: false }

    //===================== Check Present data & Validate of Size =====================//
    if (size || size == '') {
      if (!isValid(size)) return res.status(400).send({ status: false, message: "Please enter Size!" });
      size = size.split(',').map((item) => item.trim())  // this will convert string to array like string = "S,XS" to array = ["S","XS"]
      for (let i = 0; i < size.length; i++) {
        if (!isValidateSize(size[i])) return res.status(400).send({ status: false, message: "Please mention valid Size!" });
      }
      obj.availableSizes = { $all: size }  // this will check all the size is present in DB or not
    }

    //===================== Check Present data & Validate of Name =====================//
    if (name || name == '') {  // name of product
      if (!isValid(name)) { return res.status(400).send({ status: false, message: "Please enter name!" }) }
      if (!isValidName(name)) { return res.status(400).send({ status: false, message: "Please mention valid name!" }) }
      obj.title = { $regex: name }  // $regex is a mongoDB operator which will check the name is present in DB or not
    }

    //===================== Check Present data & Validate of priceGreaterThan =====================//
    if (priceGreaterThan || priceGreaterThan == '') {
      if (!isValid(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter Price Greater Than!" });
      if (!isValidPrice(priceGreaterThan)) return res.status(400).send({ status: false, message: "priceGreaterThan must be number!" });
      obj.price = { $gt: priceGreaterThan }
    }

    //===================== Check Present data & Validate of priceLessThan =====================//
    if (priceLessThan || priceLessThan == '') {
      if (!isValid(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter Price Lesser Than!" });
      if (!isValidPrice(priceLessThan)) return res.status(400).send({ status: false, message: "priceLessThan must be number!" });
      obj.price = { $lt: priceLessThan }
    }

    //===================== Check the Both data(i.e priceGreaterThan & priceLessThan) is present or not =====================//
    if (priceGreaterThan && priceLessThan) {
      obj.price = { $gt: priceGreaterThan, $lt: priceLessThan }
    }  

    //===================== Validate the Price Sort =====================//
    if (priceSort || priceSort == '') {
      if (!(priceSort == -1 || priceSort == 1)) return res.status(400).send({ status: false, message: "Please Enter '1' for Sort in Ascending Order or '-1' for Sort in Descending Order!" });
    }

    let getProduct = await productModel.find(obj).sort({ price: priceSort })

    if (getProduct.length == 0) return res.status(404).send({ status: false, message: "Product Not Found." })

    return res.status(200).send({ status: true, message: "Success", data: getProduct })

  } catch (error) {

    return res.status(500).send({ status: false, message: error.message })
  }
}


exports.deleteProduct = async (req, res) => {

  try {

      let productId = req.params.productId

      if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: `Please Enter Valid ProductId: ${productId}.` })

      let deletedProduct = await productModel.findOneAndUpdate({ isDeleted: false, _id: productId }, { isDeleted: true, deletedAt: Date.now() })

      if (!deletedProduct) { return res.status(404).send({ status: false, message: "Product is not found or Already Deleted!" }) }

      return res.status(200).send({ status: true, message: "Product Successfully Deleted." })

  } catch (error) {

      return res.status(500).send({ status: false, message: error.message })
  }
}


