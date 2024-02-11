const { default: mongoose } = require("mongoose");
mongoose.connect(`${process.env.CONNECTION_STRING}`)
.then(()=>{
    console.log("Connected")
})
.catch(()=>{
    console.log(" Not Connected")
})