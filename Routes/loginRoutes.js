const express = require('express')
const router = express.Router()
const userData = require('../Models/UserData')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const BookData = require('../Models/BookData')

router.use(express.json())
router.use(express.urlencoded({ extended: true }))
router.use(cors())

function verifytoken(req, res, next) {
    try {
        const token = req.headers.token;
        // console.log("token :"+token)
        if (!token) throw 'Unauthorized';
        let payload = jwt.verify(token, 'bookstorekey');
        if (!payload) throw 'Unauthorized';
        req.authUser = payload;
        //res.status(200).send(payload);
        next();
    } catch (error) {
        res.status(401).send('Error')
    }
}

router.get('/', verifytoken,async (req, res) => {
    try {
        const data = await userData.find({ type: { $ne: 'admin' } })
        res.status(200).json(data)
    }
    catch (error) {
        console.log(error)
    }
})


router.post('/', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(req.body)
        const user = await userData.findOne({ username });
        //console.log("user exist", user)

        if (user) {
            //console.log('User found'+user._id);
            // checking the passwords by decrypting stored password with input password
            const matchPassword = bcrypt.compareSync(password, user.password)
            if (!matchPassword) {
                res.status(401).send('Invalid credentials')
            } else {
                var userstatus = user.user_status
                const user_name = user.first_name + " " + user.last_name;
                // Generate token with a unique identifier (e.g., user ID)
                let payload = { email: username, password: password, userid: user._id, name: user_name, userstatus: userstatus };
                const token = jwt.sign(payload, 'bookstorekey');

                // Send success response with token
                res.status(200).json({ message: 'success', token });
                // res.status(200).json(user);
            }


        } else {
            console.log('User not found');
            // Authentication failed
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Error finding user:', err);
        res.json({ success: false });
        return;
    }
})


router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(req.body)
        const user = await userData.findOne({ username, type: 'admin' });
        //console.log("user exist", user)

        if (user) {
            let payload = { user: username, password: password, userid: user._id, type: user.type };
            const token = jwt.sign(payload, 'bookstorekey');

            // Send success response with token
            res.status(200).json({ message: 'success', token });
            // res.status(200).json(user);

        } else {
            console.log('User not found');
            // Authentication failed
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Error finding user:', err);
        res.json({ success: false });
        return;
    }
})



router.get('/:id', verifytoken, async (req, res) => {
    try {
        const id = req.params.id;
        const data = await userData.findById(id);
        //console.log("data is " + data)
        res.status(200).send(data);
    } catch (error) {
        res.status(400).send(error);
    }
})

router.post('/savephone', async (req, res) => {
    try {
        const { userid, phone } = req.body;


        // Find the user by some unique identifier
        const user = await userData.findOne({ _id: userid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the phone field
        user.phone = phone;

        // Save the updated user
        await user.save();
       // console.log("user",user)
        res.json({ message: "successfully saved" ,user:user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/saveaddress', async (req, res) => {
    try {
        const { userid, address } = req.body;


        // Find the user by some unique identifier
        const user = await userData.findOne({ _id: userid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the phone field
        user.address = address;

        // Save the updated user
        await user.save();

        res.json({ message: "successfully saved" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/remove/:id', verifytoken, async (req, res) => {
    try {
        const id = req.params.id;
        console.log("inside remove");
        const savedata = await userData.findByIdAndDelete(id);
        res.status(200).send({message: 'Deleted Successfully'})
    } catch (error) {
        console.log("error is :" + error)
        res.status(404).send('Error!!');
    }
})

router.get('/userOrders/:id', verifytoken, async (req, res) => {
    try {

      const userid = req.params.id;
        console.log("userid",userid)
      // Find all books with rentUser status set to true
      const user = await userData.findById(userid);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
  
        // Extract the book details from the books array in user schema
    const orderDetails = await Promise.all(user.books.map(async (book) => {
        const bookDetail = await BookData.findById(book.bookid);
        return {
          bookid: book.bookid,
          bookname: book.bookname,
          bookDetails: bookDetail,
        };
      }));
      //console.log("orderlist",orderDetails);
      orderDetails.sort((a, b) => new Date(b.bookDetails.rentUser[0].bookedon) - new Date(a.bookDetails.rentUser[0].bookedon));
      res.json(orderDetails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

module.exports = router;