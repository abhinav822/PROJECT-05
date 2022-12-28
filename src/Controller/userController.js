const userModel = require('../model/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const saltRounds = 10
const uploadFile = require('../aws/config')
const { isValidStreet, isValidImage, isValidCity, isValidPin, isValid, isValidMobile, isValidEmail, isValidName, isValidObjectId, isValidPassword, isValidRequestBody } = require('../validations/validator')




exports.createUser = async (req, res) => {

    try {

        let data = req.body
        let files = req.files

        if(files.length == 0) {return res.status(400).send({status:false, message:"provide profile image"})}

        let { fname, lname, email, profileImage, phone, password, address, ...rest } = data

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "No data found from body! You need to put the Mandatory Fields (i.e. fname, lname, email, profileImage, phone, password & address). " });
        if (isValidRequestBody(rest)) { return res.status(400).send({ status: false, message: "You can input only fname, lname, email, profileImage, phone, password & address." }) }


        if (!address) return res.status(400).send({ status: false, message: "Please give the User Address." })

        if (!isValid(data.address)) return res.status(400).send({ status: false, message: "Address should be in object and must contain shipping and billing addresses" });


        let { shipping, billing } = data.address

        //===================== Validation of Data =====================//
        if (!isValid(fname)) { return res.status(400).send({ status: false, message: 'Please enter fname' }) }
        if (!isValidName(fname)) { return res.status(400).send({ status: false, message: 'fname should be in Alphabets' }) }

        if (!isValid(lname)) { return res.status(400).send({ status: false, message: 'Please enter lname' }) }
        if (!isValidName(lname)) { return res.status(400).send({ status: false, message: 'lname should be in Alphabets' }) }

        if (!isValid(email)) { return res.status(400).send({ status: false, message: 'Please enter the EmailId' }) }
        if (!isValidEmail(email)) { return res.status(400).send({ status: false, message: 'Please enter valid emailId' }) }
        
        // if(!isValid(profileImage)) { return res.status(400).send({ status: false, message: 'Please enter the profileImage' }) }
        if (!isValid(phone)) { return res.status(400).send({ status: false, message: 'Please enter the Mobile Number' }) }
        if (!isValidMobile(phone)) { return res.status(400).send({ status: false, message: 'Please enter valid Mobile Number' }) }

        if (!isValid(password)) { return res.status(400).send({ status: false, message: 'Please enter the password' }) }
        if (!isValidPassword(password)) { return res.status(400).send({ status: false, message: "To make strong Password Should be use 8 to 15 Characters which including letters, atleast one special character and at least one Number." }) }


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
        const isDuplicateEmail = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] })  //Checking Duplicate Email or Phone is Present or Not
        if (isDuplicateEmail) {
            if (isDuplicateEmail.email == email) { return res.status(400).send({ status: false, message: `This EmailId: ${email} is already exist!` }) }
            if (isDuplicateEmail.phone == phone) { return res.status(400).send({ status: false, message: `This Phone No.: ${phone} is already exist!` }) }
        }


        //===================== Checking the File is present or not and Create S3 Link =====================//
        if (files && files.length > 0) {
            

            if (files.length > 1) return res.status(400).send({ status: false, message: "You can't enter more than one file for Create!" })
            if (!isValidImage(files[0]['originalname'])) { return res.status(400).send({ status: false, message: "You have to put only Image." }) }  // original name is the name of the file on the user's computer and if we want to get the name of the file on the server we have to use the name property 
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


exports.userLogin = async function (req, res) {

    let data = req.body
    let { email, password } = req.body

    if (!isValidRequestBody(data))
        returnres.status(400).send({ status: false, message: "Please provide data to create a user." })

    if (!email || !password)
        return res.status(400).send({ status: false, message: "email and password is required to login." })

    let user = await userModel.findOne({ email: email })
    if (!user) return res.status(401).send({ status: false, message: "Login failed!..pleaseprovide valid email." })

    let hashedPassword = user.password
    const encryptedPassword = await bcrypt.compare(password, hashedPassword)
    console.log(encryptedPassword)
    if (!encryptedPassword) res.status(401).send({ status: false, message: "Login failed!.password is incorrect." })


    // creating JWT token using userId
    let userId = user._id  
    let token = jwt.sign({ userId: userId }, "secretKey", { expiresIn: '10h' }, { iat: Math.floor(Date.now() / 1000) })  //jwt.sign is used to create token
    return res.status(200).send({ status: true, message: "User login successfull", data: { userId, token } })

}


exports.getUserProfile = async function (req, res) {
    try {
        let data1 = req.params.userId

        if (!isValidObjectId) return res.status(400).send({ status: false, message: "please provide a valid userId" })


        if (Object.keys(data1).length == 0) return res.status(400).send({ status: false, message: "please provide userId in url" })

        let findUser = await userModel.findById(data1)

        if (!findUser) return res.status(404).send({ status: false, message: "userId doesn't exist" })


        if (req.decodedToken.userId !== data1) {
            return res.status(403).send({
                status: false,
                message:
                    "Unauthorised Access: You cannot access profile of other Users.",
            });
        }

        res.status(200).send({ status: true, message: "User profile details", data: findUser })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



exports.updateUser = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId" })



        let userDb = await userModel.findById(userId)

        if (!userDb) return res.status(404).send({ status: false, messgage: 'user not found' })

        let files = req.files
        const body = req.body

        let { fname, lname, email, phone, password, address } = body

        let data = {}

        if (!isValidRequestBody(body)) return res.status(400).send({ status: false, message: "please give some data" });

        if (fname) {
            if (!isValidName(fname)) return res.status(406).send({ status: false, message: "Enter a valid fname" })
            data.fname = fname
        }

        if (lname) {
            if (!isValidName(lname)) return res.status(406).send({ status: false, message: "Enter a valid lname" })
            data.lname = lname
        }

        if (email) {
            if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "email must be in correct format for e.g. xyz@abc.com" })
            let uniqueEmail = await userModel.findOne({ email: email })
            if (uniqueEmail) return res.status(400).send({ status: false, message: "email Id Already Exists." })
            data.email = email
        }


        if (files && files.length != 0) {
            let ImageLink = await uploadFile(files[0])
            if (!isValidImage(ImageLink)) return res.status(406).send({ status: false, message: "profileImage file should be in image format", })
            data.profileImage = ImageLink
        }


        if (phone) {
            if (!isValidMobile(phone)) return res.status(400).send({ status: false, message: "invalid phone number" })
            let uniquePhone = await userModel.findOne({ phone: phone })
            if (uniquePhone) return res.status(400).send({ status: false, message: "phone number Already Exists." })
            data.phone = phone
        }



        if (password) {
            if (!isValidPassword(password)) return res.status(406).send({
                status: false, message: "passWord should be in between(8-15) & must be contain upperCase, lowerCase, specialCharecter & Number",
            })
            let newPassword = await bcrypt.hash(password, saltRounds)
            data.password = newPassword
        }

        if (address) {
            let addressData = await userModel.findById(userId).select({ _id: 0, address: 1 })
            addressData = addressData.toObject()
            if (address.shipping) {
                if (address.shipping.street) {
                    if (!isValidStreet(address.shipping.street))
                        return res.status(400).send({ status: false, message: "enter valid street" })

                    addressData.address.shipping.street = address.shipping.street
                }
                if (address.shipping.city) {
                    if (!isValidCity(address.shipping.city))
                        return res.status(400).send({ status: false, message: "enter valid city" })

                    addressData.address.shipping.city = address.shipping.city
                }

                if (address.shipping.pincode) {
                    if (!isValidPin(address.shipping.pincode))
                        return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })
                    addressData.address.shipping.pincode = address.shipping.pincode
                }
            }

            if (address.billing) {

                if (address.billing.street) {
                    if (!isValidStreet(address.billing.street))
                        return res.status(400).send({ status: false, message: "enter valid street" })

                    addressData.address.billing.street = address.billing.street
                }
                if ((address.billing.city)) {
                    if (!isValidCity(address.billing.city))
                        return res.status(400).send({ status: false, message: "enter valid city" })


                    addressData.address.billing.city = address.billing.city
                }

                if (address.billing.pincode) {
                    if (!isValidPin(address.billing.pincode))
                        return res.status(400).send({ status: false, message: "PIN code should contain 6 digits only " })
                    addressData.address.billing.pincode = address.billing.pincode
                }
            }
            data.address = addressData.address
        }

        const user = await userModel.findByIdAndUpdate(userId, data, { new: true })

        if (!user) return res.status(404).send({ status: false, message: "User not found" })

        res.status(200).send({ Status: true, message: "User updated Successfully", Data: user })

    }

    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}













