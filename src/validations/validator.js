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



  const isValidMobile = function (mobile) {
    if (/^[0]?[789]\d{9}$/.test(mobile)){
       return true
    }
}


const isValidName = function (name) {
  if (/^[a-zA-Z ]+$/.test(name)) {
    return true;
  }
};

const isValidEmail = function (email) {
  const emailRegex =
    /^[a-z0-9][a-z0-9-_\.]+@([a-z]|[a-z0-9]?[a-z0-9-]+[a-z0-9])\.[a-z0-9]{2,10}(?:\.[a-z]{2,10})?$/;
  return emailRegex.test(email);
};

const isValidPassword = (value) => { return (/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(value)); }

const isValidCity = (value) => { return (/^[A-za-z]+$/).test(value) }

const isValidPin = (value) => { return (/^[1-9][0-9]{5}$/).test(value) }

const isValidImage = (value) => { return (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/).test(value)}

const isValidateSize = (value) => { return ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(value) !== -1 }

const isValidPrice = (value) => { return (/^(?:0|[1-9]\d*)(?:\.(?!.*000)\d+)?$/).test(value) }

const isValidNum = (value) => { return /^[0-9]*[1-9]+$|^[1-9]+[0-9]*$/.test(value);}

const isValidStreet = function (street) {
  let streets = /^[#.0-9a-zA-Z\s,-]+$/;
  return streets.test(street);
};


module.exports={isValidStreet,isValidNum,isValidPrice,isValidateSize,isValidImage,isValidCity,isValidPin,isValid,isValidMobile,isValidEmail,isValidName,isValidObjectId,isValidPassword,isValidRequestBody}
