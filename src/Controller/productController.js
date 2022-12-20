const productModel=require('../model/productModel')
const {isValidObjectId}=require('../validations/validator')
const uploadFile = require("../aws/config")


const { isValidImage, validSizes, isValidNum, isValid, isValidMobile, isValidEmail, isValidName, isValidObjectId, isValidPassword, isvalidPincode, isValidRequestBody } = require('../validations/validator')

exports.createProducts = async (req, res) => {
    try {
        let data = req.body
        let files = req.files

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes } = data

        //===================== Checking User Body Data =====================//
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes"  });

        //===================== Validation of Data =====================//

        if (!isValid(title)) { return res.status(400).send({ status: false, message: 'Please enter fname' }) }
        if (!isValidName(title)) { return res.status(400).send({ status: false, message: 'Please enter valid title' }) }

        if (!isValid(description)) { return res.status(400).send({ status: false, message: 'Please enter description' }) }
        if (!isValidName(description)) { return res.status(400).send({ status: false, message: 'Please enter valid description' }) }

        if (!isValid(price)) { return res.status(400).send({ status: false, message: 'Please enter the price' }) }
        if (!isValidNum(price)) { return res.status(400).send({ status: false, message: 'Please enter valid price' }) }

        if (!isValid(currencyId)) { return res.status(400).send({ status: false, message: 'Please enter the currencyId' }) }
        if(currencyId){
        if (currencyId !="INR" ) { return res.status(400).send({ status: false, message: 'Please enter valid currencyId' }) }
        }

        if (!isValid(currencyFormat)) { return res.status(400).send({ status: false, message: 'Please enter the currencyFormat' }) }
        if (currencyFormat){
           if(currencyFormat != "₹")  { return res.status(400).send({ status: false, message: "Please enter valid currencyFormat" }) }
        }

        // <isFreeShipping> default(false) Validation.
        if (isFreeShipping){
            if (isFreeShipping != "true" && isFreeShipping != "false") {
                return res.status(400).send({ status: false, message: "isFreeShipping must be either true OR false."}); }}

        if (!isValid(style)) { return res.status(400).send({ status: false, message: 'Please enter the style' }) }
        if (!isValidName(style)) { return res.status(400).send({ status: false, message: "Please enter valid style" }) }

        if (!isValid(availableSizes)) { return res.status(400).send({ status: false, message: 'Please enter the availableSizes' }) }
        if (!validSizes(availableSizes)) { return res.status(400).send({ status: false, message: "Please enter valid availableSizes" }) }

        //----------------------------unique tittle------------------------------

        let uniqueTitle = await productModel.findOne({ title: title })
        if (uniqueTitle) { return res.status(400).send({ status: false, message: "Please provide unique title" })}

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

exports.getProductById=async function (req,res){
  try { 
    let productId=req.params.productId

    if(!isValidObjectId(productId))
    return res.status(400).send({status:false,message:"Please provide valid productId."})

    let product=await productModel.findOne({_id:productId,isDeleted:false})

    if(!product) return res.status(404).send({status:false,message:"Product Not found."})

    return res.status(200).send({status:true,message:"Success",data:product})
}catch(error){
    return res.status(500).send({status:false,message:error.message})
}

}