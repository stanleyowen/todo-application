const bcrypt = require('bcrypt');
const passport = require('passport');
const crypto = require('crypto');
var nodemailer = require('nodemailer');
const localStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const MSG_DESC = require('./callback');
let User = require('../models/users.model');
let BlacklistedToken = require('../models/blacklisted-token.model');
let Token = require('../models/token.model');

const SALT_WORK_FACTOR = 12;
const jwtSecret = process.env.JWT_SECRET;
const EMAIL_VAL = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

var transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    auth: {
      user: process.env.MAIL_EMAIL,
      pass: process.env.MAIl_PASSWORD
    }
});

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use('register', new localStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true, session: false }, (req, email, password, done) => {
    const {confirmPassword} = req.body;
    if(!email || !password || !confirmPassword) return done(null, false, { status: 400, message: MSG_DESC[11] })
    else if(EMAIL_VAL.test(String(email).toLocaleLowerCase()) === false || email.length < 6 || email.length > 40) return done(null, false, { status: 400, message: MSG_DESC[8] })
    else if(password.length < 6 || password.length > 40 || confirmPassword.length < 6 || confirmPassword.length > 40) return done(null, false, { status: 400, message: MSG_DESC[9] })
    else if(password !== confirmPassword) return done(null, false, { status: 400, message: MSG_DESC[7] })
    else {
        User.findOne({email}, (err, user) => {
            if(err) return done(null, false, { status: 500, message: MSG_DESC[0] })
            else if(user) return done(null, false, { status: 400, message: MSG_DESC[1] })
            else if(!user) {
                bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
                    if(err) return done(null, false, { status: 500, message: MSG_DESC[0] })
                    else {
                        bcrypt.hash(password, salt, (err, hash) => {
                            if(err) return done(null, false, { status: 500, message: MSG_DESC[0] })
                            else {
                                const newUser = new User ({ email, password: hash })
                                newUser.save()
                                .then(user => { return done(null, user, { status: 200, message: MSG_DESC[4] }) })
                                .catch(() => { return done(null, false, { status: 500, message: MSG_DESC[0] }) })
                            }
                        })
                    }
                })
            }
        })
    }
}))

passport.use('login', new localStrategy({ usernameField: 'email', passwordField: 'password', session: false }, (email, password, done) => {
    User.findOne({email}, (err, user) => {
        if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
        else if(!user) done(null, false, { status: 400, message: MSG_DESC[10] });
        else if(user){
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
                else if(!isMatch) return done(null, false, { status: 400, message: MSG_DESC[10] });
                else if(isMatch) return done(null, user, { status: 200, message: MSG_DESC[2] });
            })
        }
    })
}))

passport.use('editAccount', new localStrategy({ usernameField: 'id', passwordField: 'oldPassword', passReqToCallback: true, session: false }, (req, id, password, done) => {
    const {newPassword, confirmPassword} = req.body;
    if(!password || !newPassword || !confirmPassword) return done(null, false, { status: 400, message: MSG_DESC[11] });
    else if(password.length < 6 || password.length > 40 || newPassword.length < 6 || newPassword.length > 40 || confirmPassword.length < 6 || confirmPassword.length > 40) return done(null, false, { status: 400, message: MSG_DESC[9] });
    else if(newPassword !== confirmPassword) return done(null, false, { status: 400, message: MSG_DESC[7] });
    else {
        User.findById(id, (err, user) => {
            if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
            else if(!user) return done(null, false, { status: 400, message: MSG_DESC[8] });
            else if(user) {
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
                    else if(!isMatch) return done(null, false, { status: 400, message: MSG_DESC[10] });
                    else if(isMatch){
                        bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
                            if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
                            else {
                                bcrypt.hash(newPassword, salt, (err, hash) => {
                                    if(err) return res.status(500).json({statusCode: 500, message: MSG_DESC[0]});
                                    else {
                                        const token = req.cookies['jwt-token']
                                        BlacklistedToken.findOne({ token }, (err, isListed) => {
                                            if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
                                            else if(isListed) return done(null, false, { status: 401, message: MSG_DESC[15] });
                                            else if(!isListed){
                                                user.password = hash;
                                                user.save()
                                                return done(null, user, { status: 200, message: MSG_DESC[6] });
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    }
}))

passport.use('forgetPassword', new localStrategy({ usernameField: 'email', passwordField: 'email', session: false }, (email, password, done) => {
    User.findOne({email}, (err, user) => {
        if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
        else if(!user) return done(null, false, { status: 400, message: MSG_DESC[15] });
        else {
            const token = crypto.randomBytes(64).toString("hex");
            const createToken = new Token({ userId: user.id, token  })
            createToken.save();
            var mailOptions = {
                to: email,
                subject: 'Password Recovery',
                text: token
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if(err) done(null, false, { status: 500, message: MSG_DESC[0] });
                else done(null, false, { status: 200, message: MSG_DESC[29] });
            });
        }
    })
}))

passport.use('github', new GitHubStrategy ({ clientID: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET, callbackURL: process.env.GITHUB_CALLBACK }, (accessToken, refreshToken, profile, done) => {
    const email = profile._json.email;
    User.findOne({email}, (err, user) => {
        if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
        else if(!user){
            const dataModel = new User ({
                email,
                password: null,
                thirdParty: {
                    isThirdParty: true,
                    provider: 'github',
                    status: 'Pending'
                }
            });
            dataModel.save()
            return done(null, user, { status: 302, type: 'redirect', url: `/auth/github/${encodeURIComponent(email)}` })
        }else if(user){
            if(user.thirdParty.isThirdParty && user.thirdParty.provider === "github" && user.thirdParty.status === "Pending") return done(null, user, { status: 302, type: 'redirect', url: `/auth/github/${encodeURIComponent(email)}` })
            else if(user.thirdParty.isThirdParty && user.thirdParty.provider === "github" && user.thirdParty.status === "Success"){
                return done(null, user, { status: 200 })
            }else if(user.thirdParty.isThirdParty) return done(null, false, { status: 400, message: MSG_DESC[28] });
            else return done(null, false, { status: 400, message: MSG_DESC[16] });
        }
    })
}))

passport.use('connectViaGithub', new GitHubStrategy ({ clientID: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET, callbackURL: `${process.env.GITHUB_CALLBACK}/connect` }, (accessToken, refreshToken, profile, done) => {
    const email = profile._json.email;
    User.findOne({email}, (err, user) => {
        if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
        else if(!user) return done(null, false, { status: 401, message: MSG_DESC[16] });
        else if(user) return done(null, user, { status: 200 })
    })
}))

passport.use('google', new GoogleStrategy ({ clientID: process.env.GOOGLE_ID, clientSecret: process.env.GOOGLE_SECRET, callbackURL: process.env.GOOGLE_CALLBACK }, (accessToken, refreshToken, profile, done) => {
    const email = profile._json.email;
    User.findOne({email}, (err, user) => {
        if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
        else if(!user){
            const dataModel = new User ({
                email,
                password: null,
                thirdParty: {
                    isThirdParty: true,
                    provider: 'google',
                    status: 'Pending'
                }
            });
            dataModel.save()
            return done(null, user, { status: 302, type: 'redirect', url: `/auth/google/${encodeURIComponent(email)}` })
        }else if(user){
            if(user.thirdParty.isThirdParty && user.thirdParty.provider === "google" && user.thirdParty.status === "Pending") return done(null, user, { status: 302, type: 'redirect', url: `/auth/google/${encodeURIComponent(email)}` })
            else if(user.thirdParty.isThirdParty && user.thirdParty.provider === "google" && user.thirdParty.status === "Success"){
                return done(null, user, { status: 200 })
            }else if(user.thirdParty.isThirdParty) return done(null, false, { status: 400, message: MSG_DESC[28] });
            else return done(null, false, { status: 400, message: MSG_DESC[16] });
        }
    })
}))

passport.use('connectViaGoogle', new GoogleStrategy ({ clientID: process.env.GOOGLE_ID, clientSecret: process.env.GOOGLE_SECRET, callbackURL: `${process.env.GOOGLE_CALLBACK}?connect=true` }, (accessToken, refreshToken, profile, done) => {
    const email = profile._json.email;
    User.findOne({email}, (err, user) => {
        if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
        else if(!user) return done(null, false, { status: 401, message: MSG_DESC[16] });
        else if(user) return done(null, user, { status: 200 })
    })
}))

passport.use('getOAuthData', new localStrategy({ usernameField: 'email', passwordField: 'email', passReqToCallback: true, session: false }, (req, email, password, done) => {
    const provider = req.params.provider;
    if(!provider) return done(null, false, { status: 400, message: MSG_DESC[11] });
    else if(EMAIL_VAL.test(String(email).toLocaleLowerCase()) === false || email.length < 6 || email.length > 40) return done(null, false, { status: 400, message: MSG_DESC[8] })
    else if(email.length < 6 || email.length > 40) return done(null, false, { status: 400, message: MSG_DESC[8] });
    User.findOne({email, 'thirdParty.provider': provider }, (err, user) => {
        if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
        else if(!user) done(null, false, { status: 400, message: MSG_DESC[13] });
        else if(user){
            if(user.thirdParty.isThirdParty && user.thirdParty.status === "Pending"){
                return done(null, user, { status: 200, message: true })
            }else done(null, false, { status: 400, message: MSG_DESC[13] });
        }
    })
}))

passport.use('registerOAuth', new localStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true, session: false }, (req, email, password, done) => {
    const provider = req.params.provider;
    if(!provider) return done(null, false, { status: 400, message: MSG_DESC[3] });
    else if(EMAIL_VAL.test(String(email).toLocaleLowerCase()) === false || email.length < 6 || email.length > 40) return done(null, false, { status: 400, message: MSG_DESC[4] });
    else if(password.length < 6 || password.length > 40) return done(null, false, { status: 400, message: MSG_DESC[9] });
    User.findOne({email, 'thirdParty.provider': provider }, (err, user) => {
        if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
        else if(!user) done(null, false, { status: 400, message: MSG_DESC[13] });
        else if(user){
            if(user.thirdParty.isThirdParty && user.thirdParty.status === "Pending"){
                bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
                    if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
                    else {
                        bcrypt.hash(password, salt, (err, hash) => {
                            if(err) return done(null, false, { status: 500, message: MSG_DESC[0] });
                            else {
                                user.password = hash;
                                user.thirdParty.status = "Success";
                                user.save()
                                .then(user => { return done(null, user, { status: 200, message: MSG_DESC[4] }) })
                                .catch(() => { return done(null, false, { status: 500, message: MSG_DESC[0] }) })
                            }
                        })
                    }
                })
            }else done(null, false, { status: 400, message: MSG_DESC[13] });
        }
    })
}))

const extractJWT = (req) => {
    var token = null;
    if(req.cookies) token = req.cookies['jwt-token'];
    return token;
}

const opts = {
    jwtFromRequest: extractJWT,
    secretOrKey: jwtSecret,
};

passport.use('jwt', new JWTStrategy(opts, (jwt_payload, done) => {
    User.findById(jwt_payload.id, (err, user) => {
        if(err) done(null, false);
        else if(user) done(null, user);
        else done(null, false);
    })
}))

module.exports = passport;