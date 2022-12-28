const express = require('express');
const route = require('./route/route')
const mongoose = require('mongoose');
const app = express();
const multer = require('multer')

app.use(express.json());
app.use(multer().any())  // 
app.use(express.urlencoded({ extended: true }));


mongoose.connect("mongodb+srv://abhinav-5:zs2mhDrMQPl0Kjmc@cluster0.5qq85m2.mongodb.net/?retryWrites=true&w=majority",{
    useNewUrlParser:true
})
.then(()=> console.log("MongoDb is connected.."))
.catch((error)=> console.log(error))

app.use('/', route)

app.listen(process.env.PORT || 3000, function () {
    console.log("Express app running on port " + (process.env.PORT || 3000));
  });