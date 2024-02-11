const express = require('express')
const app = new express()
require('dotenv').config()
const cors = require('cors')
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const path = require('path');
app.use(express.static(path.join(__dirname,'/build')));

const PORT = process.env.PORT

const morgan= require('morgan');
app.use(morgan('dev'));

require('./config/dbConnection')

// signup route
const signupRoutes = require('./Routes/signupRoutes')
app.use('/api/signup', signupRoutes)

//login route
const loginRoutes = require('./Routes/loginRoutes')
app.use('/api/login',loginRoutes)

//book route
const bookRoutes = require('./Routes/bookRoutes')
app.use('/api/books',bookRoutes)

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname
    ,'/build/index.html')); });

app.listen(PORT,()=>{
    console.log('Listening to '+ PORT)
})