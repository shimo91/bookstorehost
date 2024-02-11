const mongoose = require('mongoose')
const { Schema, ObjectId } = mongoose;
const userSchema = Schema({
    
    username: {
        type:String,
        required: true,
        unique:true,
        lowercase: true,
        index: true 
    },
    password: {
        type:String,
        required: true
    },
    first_name: {
        type: String,
    },
    last_name: {
        type: String,
    },
    phone: {
        type: Number
    
    },
    address: {
        type: String
    
    },
    registeredon: {
        type: Date,
        default: Date.now,
    },
    user_status: {
        type: Boolean,
        default: true, 
      },
    libraryId: String,
    books: [
        {
          bookid: ObjectId,
          bookname:String,
        }
      ],
})

const UserData = mongoose.model('userdatas',userSchema)
module.exports = UserData