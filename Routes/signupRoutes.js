const express = require('express')
const router = express.Router()
const UserData = require("../Models/UserData")
const bcrypt = require("bcryptjs")
const uuid = require('uuid');
const crypto = require('crypto');

router.post('/', async (req, res) => {
    try {
        const { username, password, phone, first_name, last_name, address } = req.body;
        console.log(req.body)
        const user = await UserData.findOne({ username });
        console.log("user data", user)
        if (!user) {
            // Generate a unique library ID for the user
            const libraryId = generateLibraryId(first_name);
            const hashedPwd = bcrypt.hashSync(password, 8)
            const user = await UserData.create({ username, password: hashedPwd, first_name, last_name, phone, address, libraryId: libraryId })
            res.status(200).json({ success: true, message: "Registration Successfull" })
        } else {
            res.status(400).json({ message: "Email id already taken" })
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(400).json({ message: "Fail to connect" })
        // res.json({ success: false });
        // return;
    }
})

router.post('/libraryupdate', async (req, res) => {
    try {
        const { username, userid } = req.body;

        // Generate a unique library ID for the user
        const libraryId = generateLibraryId(username);


        // Find the user by some unique identifier
        const user = await UserData.findOne({ _id: userid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the libraryId field
        user.libraryId = libraryId;

        // Save the updated user
        await user.save();

        res.json({ message: "success", libraryId: libraryId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


function generateLibraryId(username) {
    const halfusername = username.slice(0, Math.floor(username.length / 2));
    // const timestampString = Date.now().toString(36); // Convert timestamp to base36
    // const timestampNumber = parseInt(timestampString, 36);
    // const randomString = crypto.randomBytes(2).toString('hex'); // Generate a random string

    let ts = Date.now();

    // timestamp in milliseconds
    console.log(ts);

    // timestamp in seconds
    console.log(Math.floor(ts / 1000));

    const timestamp=Math.floor(ts / 1000)
    // Combine timestamp, random string, and username (or any other unique information)
    const uniqueId = `${halfusername}${timestamp}`;

    return uniqueId;
}

module.exports = router;