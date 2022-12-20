const userModel = require('../model/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const saltRounds = 10
const uploadFile = require('../aws/config')
const {isValidImage,isValidCity,isValidPin,isValid,isValidMobile,isValidEmail,isValidName,isValidObjectId,isValidPassword,isvalidPincode,isValidRequestBody} = require('../validations/validator')




//<<<===================== This function is used for Create User =====================>>>//
exports.createUser = async (req, res) => {

    try {

        let data = req.body
        let files = req.files
        
        let { fname, lname, email, profileImage, phone, password, address , ...rest} = data
        
        //===================== Checking User Body Data =====================//
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "No data found from body! You need to put the Mandatory Fields (i.e. fname, lname, email, profileImage, phone, password & address). " });
        if (isValidRequestBody(rest)) { return res.status(400).send({ status: false, message: "You can input only fname, lname, email, profileImage, phone, password & address." }) }
        
        
        if (!address) return res.status(400).send({ status: false, message: "Please give the User Address." })
        
        if (!isValid(data.address)) return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });
        
        //===================== Destructuring Address from Object Data =================================//
        
        let { shipping, billing } = data.address

        //===================== Validation of Data =====================//
        if (!isValid(fname)) { return res.status(400).send({ status: false, message: 'Please enter fname' }) }
        if (!isValidName(fname)) { return res.status(400).send({ status: false, message: 'fname should be in Alphabets' }) }

        if (!isValid(lname)) { return res.status(400).send({ status: false, message: 'Please enter lname' }) }
        if (!isValidName(lname)) { return res.status(400).send({ status: false, message: 'lname should be in Alphabets' }) }

        if (!isValid(email)) { return res.status(400).send({ status: false, message: 'Please enter the EmailId' }) }
        if (!isValidEmail(email)) { return res.status(400).send({ status: false, message: 'Please enter valid emailId' }) }

        if (!isValid(phone)) { return res.status(400).send({ status: false, message: 'Please enter the Mobile Number' }) }
        if (!isValidMobile(phone)) { return res.status(400).send({ status: false, message: 'Please enter valid Mobile Number' }) }

        if (!isValid(password)) { return res.status(400).send({ status: false, message: 'Please enter the password' }) }
        if (isValidPassword(password)) { return res.status(400).send({ status: false, message: "To make strong Password Should be use 8 to 15 Characters which including letters, atleast one special character and at least one Number." }) }


        //===================== Validation of Shipping Address =====================//
        if (!shipping) return res.status(400).send({ status: false, message: "Enter Shipping Address." })

        if (!isValid(shipping.street)) { return res.status(400).send({ status: false, message: 'Please enter Shipping street' }) }

        if (!isValid(shipping.city)) { return res.status(400).send({ status: false, message: 'Please enter Shipping city' }) }
        if (!isValidCity(shipping.city)) { return res.status(400).send({ status: false, message: 'Invalid Shipping city' }) }

        if (!isValid(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Please enter Shipping pin' }) }
        if (!isValidPin(shipping.pincode)) { return res.status(400).send({ status: false, message: 'Invalid Shipping Pin Code.' }) }


        //===================== Validation of Billing Address =====================//
        if (!billing) return res.status(400).send({ status: false, message: "Enter Billing Address." })

        if (!isValid(billing.street)) { return res.status(400).send({ status: false, message: 'Please enter billing street' }) }

        if (!isValid(billing.city)) { return res.status(400).send({ status: false, message: 'Please enter billing city' }) }
        if (!isValidCity(billing.city)) { return res.status(400).send({ status: false, message: 'Invalid billing city' }) }

        if (!isValid(billing.pincode)) { return res.status(400).send({ status: false, message: 'Please enter billing pin' }) }
        if (!isValidPin(billing.pincode)) { return res.status(400).send({ status: false, message: 'Invalid billing Pin Code.' }) }


        //===================== Encrypt the password =====================//
        data.password = await bcrypt.hash(password, saltRounds)


        //===================== Fetching data of Email from DB and Checking Duplicate Email or Phone is Present or Not =====================//
        const isDuplicateEmail = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] })
        if (isDuplicateEmail) {
            if (isDuplicateEmail.email == email) { return res.status(400).send({ status: false, message: `This EmailId: ${email} is already exist!` }) }
            if (isDuplicateEmail.phone == phone) { return res.status(400).send({ status: false, message: `This Phone No.: ${phone} is already exist!` }) }
        }


        //===================== Checking the File is present or not and Create S3 Link =====================//
        if (files && files.length > 0) {

            if (files.length > 1) return res.status(400).send({ status: false, message: "You can't enter more than one file for Create!" })
            if (!isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "You have to put only Image." }) }

            data.profileImage = await uploadFile(files[0])
        }
        else {
            return res.status(400).send({ msg: "Please put image to create registration!" })
        }


        //x===================== Final Creation of User =====================
        let userCreated = await userModel.create(data)

        return res.status(201).send({ status: true, message: "User created successfully", data: userCreated })

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}


exports.userLogin=async function(req,res){

    let data=req.body
    let {email,password}=req.body

    if(!isValidRequestBody(data)) 
    returnres.status(400).send({status:false,message:"Please provide data to create a user."})

    if(!email || !password)
    returnres.status(400).send({status:false,message:"email and password is required to login."})

    let user=await userModel.findOne({email:email})
    if(!user) return res.status(401).send({status:false,message:"Login failed!..pleaseprovide valid email."})

    let hashedPassword = user.password
     const encryptedPassword = await bcrypt.compare(password, hashedPassword)
     console.log(encryptedPassword)
    if(!encryptedPassword) res.status(401).send({status:false,message:"Login failed!.password is incorrect."})


// creating JWT token using userId
let userId=user._id
let token= jwt.sign({userId:userId},"secretKey",{expiresIn: '10h'},{iat: Math.floor(Date.now() / 1000)})
return res.status(200).send({status:true,message:"User login successfull",data:{userId,token}})

}
