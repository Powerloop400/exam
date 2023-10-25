const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/user')
const secretkey = process.env.JWT_SECRET;
const authRouter = express.Router();

authRouter.use(bodyParser.urlencoded({ extended: false }));
authRouter.use(bodyParser.json());
authRouter.use(express.json());

const passport = require('passport');


authRouter.post(
  '/signup',
  passport.authenticate('signup', { session: false }), async (req, res, next) => {
      res.json({
          message: 'Signup successful',
          user: req.user
      });
      res.redirect('/');
  }
);

authRouter.post(
  '/login',
    async (req, res, next) => {
        passport.authenticate('login', async (err, user, info) => {
            try {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    const error = new Error('Username or password is incorrect');
                    return next(error);
                }

                req.login(user, { session: false },
                    async (error) => {
                        if (error) return next(error);

                        const payload = {  userId: user._id,  email: user.email,};

                        const token = jwt.sign(payload, secretkey, { expiresIn: '1h' });

                        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
                        req.user = user;
                        res.redirect('/');
                    }
                );
            } catch (error) {
                return next(error);
            }
        }
        )(req, res, next);
    }
);


  
  module.exports = authRouter;