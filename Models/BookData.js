const mongoose = require('mongoose');
const { Schema, ObjectId } = mongoose;
const bookSchema = Schema({
    title: String,
    subtitle: String,
    author: String,
    imageUrl: {
      type: Buffer, // Store the image data as a buffer
      required: true,
    },
    genre: String,
    available: {
        type: Boolean,
        default: true,
    },
    description:String,
    isbn_number:String,
    languages:String,
    published_on:String,
    rental_period:Number,
    reviews: [
        {
          username: String,
          content: String
        }
      ],
      rentUser: [
        {
          userid: ObjectId,
          username:String,
          libraryid:String,
          address:String,
          phoneNumber:String,
          deliveryStatus:{
            type:Boolean,
            default:false,
          },
          bookedon: {
            type: Date,
            default: Date.now,
          },
        }
      ],

})
const BookData = mongoose.model('book', bookSchema);
module.exports = BookData;