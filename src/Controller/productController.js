const productModel=require('../model/productModel')
const {isValidObjectId}=require('../validations/validator')

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