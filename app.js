const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const passport = require('passport');
const Blog = require('./models/blog');
const path = require('path');
const methodOverride = require('method-override');
const app = express();
const jwt = require('jsonwebtoken');
const secretkey = process.env.JWT_SECRET;
const port = 3000;

require('./db').connectToMongoDB();

require("./authentication/auth") // Signup and login authentication middleware

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(methodOverride('_method'))

function authenticate(req, res, next) {
  const token = req.cookies.token;  

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secretkey, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.redirect('/error');
      } else {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

        req.user = decoded;


    next();
  });
}


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const blogsRoute = require('./routes/blogs');
const authRoute = require('./routes/auth');

app.use('/', blogsRoute);
app.use('/', authRoute);

app.get('/', (req, res) => {
    res.render('index');
}); 

app.post('/edit', authenticate, async(req, res) => {
    const { blogId } = req.body;
    const blog = await Blog.findOne({ _id: blogId, author: req.user.userId }).exec();

    if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
    }

    res.render('edit', { blog }); 
});


app.get('/login', (req, res) => {       
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/create', authenticate, (req, res) => {
    res.render('create'); 
});

app.get('/error', (req, res) => {
    res.render('error'); 
});


// Define routes for authenticated users
// For example, you can put your /blogs/:blogId/publish and other authenticated routes here

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;