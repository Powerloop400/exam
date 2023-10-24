  const passport = require('passport');
  const localStrategy = require('passport-local').Strategy;

  const UserModel = require('../models/user');

  const JWTstrategy = require('passport-jwt').Strategy;
  const ExtractJWT = require('passport-jwt').ExtractJwt;
  secretkey = process.env.JWT_SECRET;

  passport.use(
    'signup',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true  // This allows us to access the request in the callback
        },
        async (req, email, password, done) => {
            const { first_name, last_name } = req.body;

            try {
                const user = await UserModel.create({ email, password, first_name, last_name });

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);


  passport.use(
      'login',
      new localStrategy(
          {
              usernameField: 'email',
              passwordField: 'password'
          },
          async (email, password, done) => {
              try {
                  const user = await UserModel.findOne({ email });

                  if (!user) {
                      return done(null, false, { message: 'User not found' });
                  }

                  const validate = await user.isValidPassword(password);

                  if (!validate) {
                      return done(null, false, { message: 'Wrong Password' });
                  }

                  return done(null, user, { message: 'Logged in Successfully' });
              } catch (error) {
                  return done(error);
              }
          }
      )
  );