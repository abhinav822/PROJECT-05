const productModel = require('../model/productModel')
const uploadFile = require("../aws/config")
const { isValidPrice, isValidNum, isValidateSize, isValidImage, isValid, isValidName, isValidObjectId, isValidRequestBody } = require('../validations/validator')



exports.createProducts = async (req, res) => {
  try {
    let data = req.body
    let files = req.files

    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = data

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
      let size = availableSizes.toUpperCase().split(",")  // purpose of this is to con
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

    if (installments) {
      if (!isValidNum(installments)) return res.status(400).send({ status: false, message: "Provied the valid installments and it will be in number format only" })
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

      let data = req.query  // why we use query but we are giving data in body 

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
      let obj = { isDeleted: false }  //we have craeted this object to store the data 

      //===================== Check Present data & Validate of Size =====================//
      if (size || size == '') {
          if (!isValid(size)) return res.status(400).send({ status: false, message: "Please enter Size!" });
          size = size.split(',').map((item) => item.trim())  // item.trim() is used to remove space from the string
          for (let i = 0; i < size.length; i++) {
              if (!isValidateSize(size[i])) return res.status(400).send({ status: false, message: "Please mention valid Size!" });
          }
          obj.availableSizes = { $all: size }   // obj.availableSizes = {$all: size} means that the array of availableSizes must contain all the values in the size array.
      }

      //===================== Check Present data & Validate of Name =====================//
      if (name || name == '') {
          if (!isValid(name)) { return res.status(400).send({ status: false, message: "Please enter name!" }) }
          if (!isValidName(name)) { return res.status(400).send({ status: false, message: "Please mention valid name!" }) }
          obj.title = { $regex: name }  // $regex is used to search the data in the database
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

      //x===================== Fetching All Data from Product DB =====================x//
      let getProduct = await productModel.find(obj).sort({ price: priceSort })

      //===================== Checking Data is Present or Not in DB =====================//
      if (getProduct.length == 0) return res.status(404).send({ status: false, message: "Product Not Found." })

      return res.status(200).send({ status: true, message: "Success", data: getProduct })

  } catch (error) {

      return res.status(500).send({ status: false, message: error.message })
  }
}



exports.updateProducts = async (req, res) => {
  try {
    let productId = req.params.productId

    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid productId" })

    let product = await productModel.findById(productId)

    if (product.isDeleted == true) {
      return res.status(404).send({ status: false, message: "This product has been deleted" })
    }


    const body = req.body
    const files = req.files

    let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = body

    data = {}
    //========================= if no keys are provided to update data========================//
    if (!(title || description || price || currencyId || currencyFormat || isFreeShipping || style || availableSizes || installments || files)) {
      return res.status(400).send({ status: false, message: `please enter valid key in body` })
    }

    if (title) {
      if (!isValidName(title)) return res.status(400).send({ status: false, message: "please enter the valid title" })
      let uniqueTitle = await productModel.findOne({ title: title })
      if (uniqueTitle) return res.status(400).send({ status: false, message: "this title is already present...to update please give a new title" })
      data.title = title
    }

    if (description) {
      if (!isValidName(description)) return res.status(400).send({ status: false, message: "Please enter valid description" })
      data.description = description
    }
    if (price) {
      if (!isValidPrice(price)) return res.status(400).send({ status: false, message: "'price should be in valid Format with Numbers || Decimals" })
      data.price = price
    }

    if (currencyId) {
      if (currencyId != "INR") return res.status(400).send({ status: false, message: "currencyId Should be in this form 'INR' only" })
      data.currencyId = currencyId
    }

    if (currencyFormat) {
      if (currencyFormat != "₹") { return res.status(400).send({ status: false, message: "currencyFormat Should be in this form '₹' only" }) }
      data.currencyFormat = currencyFormat
    }

    if (isFreeShipping) {
      if (isFreeShipping != "true" && isFreeShipping != "false")
        return res.status(400).send({ status: false, message: "isFreeShipping Should be in boolean with small letters" })
      data.isFreeShipping = isFreeShipping
    }

    if (files && files.length != 0) {
      let ImageLink = await uploadFile(files[0])
      if (!urlreg.test(ImageLink)) return res.status(406).send({
        status: false, message: "image file should be in image format",
      })
      data.productImage = ImageLink
    }

    if (style) {
      if (!isValidName(style)) return res.status(400).send({ status: false, message: "please enter the style in string" })
      data.style = style
    }

    if (availableSizes) {
      availableSizes = availableSizes.toUpperCase()
      let size = availableSizes.split(',').map(x => x.trim())
      //=========================================================//
      for (let i = 0; i < size.length; i++) {
        if (!validSizes(size[i]))
          return res.status(400).send({ status: false, message: "availableSizes should have only these Sizes ['S' || 'XS'  || 'M' || 'X' || 'L' || 'XXL' || 'XL']" })

      }
      data['$addToSet'] = {}
      data['$addToSet']['availableSizes'] = size

    }

    if (installments) {
      if (!isValidNum(installments)) return res.status(400).send({ status: false, message: "installments should have only Number" })
      data.installments = installments
    }

    //==============================Update-Product=========================//

    let newProduct = await productModel.findOneAndUpdate({ _id: productId }, data, { new: true })
    if (!newProduct) {
      return res.status(404).send({ status: false, message: "this product can't be update because it is not exist" });
    }
    return res.status(200).send({ status: true, message: "product is successfully updated", data: newProduct })



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