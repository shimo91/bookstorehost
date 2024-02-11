const express = require('express');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const bookData = require('../Models/BookData');
const jwt = require('jsonwebtoken');
const BookData = require('../Models/BookData');
const UserData = require('../Models/UserData');


const multer = require('multer');
const fs = require('fs/promises');

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function verifytoken(req, res, next) {
    try {
        const token = req.headers.token;
        // console.log("token :"+token)
        if (!token) throw 'Unauthorized';
        let payload = jwt.verify(token, 'bookstorekey');
        if (!payload) throw 'Unauthorized';
        //res.status(200).send(payload);
        next();
    } catch (error) {
        res.status(401).send('Error')
    }
}

router.get('/bookDetail/:id', async (req, res) => {
    try {
        const id = req.params.id;
       // console.log("id is",id)
        const data = await BookData.findById(id);
       // console.log("data is " + data)
        res.status(200).send(data);
    } catch (error) {
        res.status(400).send(error);
    }
})

router.get('/similarBooks', async (req, res) => {
    try {
        const { genre, currentBookId } = req.query;
      // Fetch similar books from the database based on the genre, excluding the current book
    const similarBooks = await BookData.find({ genre: genre, _id: { $ne: currentBookId } }).limit(6);
  
      res.json(similarBooks);
    } catch (error) {
      console.error('Error fetching similar books:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/booksReview/:bookId', verifytoken, async (req, res) => {
    const { username, content } = req.body;
    const bookId = req.params.bookId;

    try {
        const book = await BookData.findById(bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Add the review to the book's reviews array
        book.reviews.push({ username, content });

        // Save the updated book
        await book.save();

        //res.json(book);
        res.status(200).json({ message: 'Saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/bookRent', verifytoken, async (req, res) => {
    //console.log("request", req.body);
    const { userid, bookid, username, libraryid, address, phoneNumber,bookname} = req.body;

    try {
        // Find the book by its ID
        const book = await BookData.findById(bookid);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        // Add the user details to the book's rentUser array
        book.rentUser.push({ userid, username, libraryid, address, phoneNumber });

        // Save the updated book
        await book.save();

        await BookData.findByIdAndUpdate(bookid, {available:false});

        const user = await UserData.findById(userid);
        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }
        // Add the book details to the user's books array
        user.books.push({ bookid, bookname });

        // Save the updated user
        await user.save();

        // Send a success response
        res.status(200).json({ message: 'Successfully booked your request. It will be delivered soon' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/getbooklist', verifytoken, async (req, res) => {
    try {

        const data = await BookData.find().sort({ _id: -1 });
        // console.log("description :"+data)
        res.status(200).send(data);
    } catch (error) {
        res.status(400).send(error);
    }
})

router.get('/getfeatured', async (req, res) => {
    try {

        const data = await BookData.find().sort({ _id: -1 }).limit(3);
         console.log("featured :"+data)
        res.status(200).send(data);
    } catch (error) {
      console.error(error);
        res.status(400).send(error);
    }
})

router.get('/rentUsers', verifytoken, async (req, res) => {
    try {
      // Find all books with rentUser status set to true
      const books = await BookData.find({ 'rentUser.deliveryStatus': false }).populate('rentUser');
  
      // Extract rent users from all books
      const rentUsers = books.reduce((allRentUsers, book) => {
        return allRentUsers.concat(book.rentUser.filter(user => !user.deliveryStatus)
        .map((user) => ({
            user,
            book: {
              title: book.title, // Add other book details as needed
              author: book.author,
              id:book._id,
              available:book.avalable
            },
          }))
        
        );
      }, []);
      // Sort rentUsers based on bookedon in ascending order
        rentUsers.sort((a, b) => new Date(b.user.bookedon) - new Date(a.user.bookedon));
      //console.log("rent user",rentUsers)
      res.status(200).send(rentUsers);
      //res.json({ rentUsers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });



  router.post('/updatedelivery/:bookId', verifytoken, async (req, res) => {
    //console.log("delivery", req.body);
    const { rentid, deliverystatus} = req.body;
    const bookId = req.params.bookId;
    //console.log("bookid",bookId);
    //console.log("delivery status",deliverystatus,"rentid",rentid)
    try {
        // Find the book by its ID
        const book = await BookData.findById(bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        await BookData.updateOne(
            { _id: bookId, 'rentUser._id': rentid },
            { $set: { 'rentUser.$.deliveryStatus': deliverystatus } }
          );

        // Send a success response
        res.status(200).json({ message: 'Updated book delivery status' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.put('/updateAvailable/:id', verifytoken, async (req, res) => {
    try {
        var item = req.body;
        console.log("item for update",item);
        const data = await BookData.findByIdAndUpdate(req.params.id, item);
        res.status(200).send({ message: 'Updated book availability successfully' });
    } catch (error) {
        res.status(404).send({ message: 'Update not working' });
    }
})



router.post('/add', upload.single('imageUrl'), verifytoken, async (req, res) => {
    try{
  
        const {
            author,
            available,
            description,
            genre,
            isbn_number,
            languages,
            published_on,
            rental_period,
            title
          } = req.body;
      
          // Extract image file data
          const imageBuffer = req.file.buffer;
      
          // Create a new BookData instance with the provided data and image buffer
          const newBook = new BookData({
            author,
            available,
            description,
            genre,
            imageUrl: imageBuffer, // Assuming imageUrl field in the model is of type Buffer
            isbn_number,
            languages,
            published_on,
            rental_period,
            title,
          });
      
          // Save the new book data to the database
          const savedBook = await newBook.save();
      
        //  console.log('Saved book:', savedBook);
  
      res.status(200).send({ message: 'Saved successfully '});
    } catch (error) {
        console.error('Error saving book:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
  });




router.put('/update/:id',  upload.single('imageUrl'), verifytoken,  async (req, res) => {
    try {
        const bookId = req.params.id;
        // Check if a new image is provided
    // Check if a new image is provided
    const imageUrl = req.file ? req.file.buffer : undefined;

    // Retrieve the existing book data
    const existingBook = await BookData.findById(bookId);

    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Create a copy of req.body to avoid modifying it directly
    const updatedFields = { ...req.body };

    // Remove imageUrl property to exclude it from being set
    delete updatedFields.imageUrl;

    // Update every field without checking existing values, except for the image field
    existingBook.set(updatedFields);

    // Update imageUrl only if a new image is provided
    if (imageUrl) {
      existingBook.imageUrl = imageUrl;
    }

    // Save the updated book data
    const updatedBook = await existingBook.save();

    res.status(200).json({ message: 'Book updated successfully', book: updatedBook });

  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

router.delete('/remove/:id', verifytoken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log("inside remove");
        const savedata = await BookData.findByIdAndDelete(id);
        res.status(200).send({message: 'Deleted Successfully'})
    } catch (error) {
        console.log("error is :" + error)
        res.status(404).send('Error!!');
    }
})

module.exports = router;