const mongoose = require('mongoose')

const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false //it checks whether the value is null or undefined.
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
}

const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0; // it checks, is there any key is available or not in request body
}

const isValidEmail = function (value) {
    let emailRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-z\-0-9]+\.)+[a-z]{2,}))$/;
    if (emailRegex.test(value)) return true;
  }

  const isValidMobile = function (mobile) {
    if (/^[0]?[789]\d{9}$/.test(mobile)){
       return true
    }
}

const isvalidPincode= function (value) {
    return (/^(?=.[0-9])[a-zA-Z0-9!@#$%^&]{1,6}$/.test(value))
  }

  const isValidPassword = function (password) {
    return (/^(?=.[0-9])(?=.[!@#$%^&])[a-zA-Z0-9!@#$%^&]{8,15}$/.test(password))
}

const isValidName = function (name) {
    if (/^[a-zA-Z ]+$/.test(name)) {
      return true;
    }
  };

const isValidCity = (value) => { return (/^[A-za-z]+$/).test(value) }

const isValidPin = (value) => { return (/^[1-9][0-9]{5}$/).test(value) }

const isValidImage = (value) => { return (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/).test(value)}

module.exports={isValidImage,isValidCity,isValidPin,isValid,isValidMobile,isValidEmail,isValidName,isValidObjectId,isValidPassword,isvalidPincode,isValidRequestBody}
