'use strict';
const _ = require('lodash');
const app = require('../../server/server')
const config = require('../../server/config.json')
const path = require('path');
module.exports = function (Profil) {
  //creation method adminLogin for admin login
  Profil.adminLogin = (sign_in, password, next) => {
    Profil.findOne({
      where: {
        or: [{
          username: sign_in
        }, {
          email: sign_in
        }]
      }
    }, (err, res) => {
      if (err) {
        next(err)
      }
      if (res) {
        if (res.role == "superadmin") {
          console.log('************** super superadmin ')
          if (validateEmail(sign_in)) {
            Profil.login({
              email: sign_in,
              password: password
            }, (err, token) => {
              if (err) {
                next(err)
                console.log("************" + err)
              }
              next(null, token)
            })
          } else {
            Profil.login({
              username: sign_in,
              password: password
            }, (err, token) => {
              if (err) {
                next(err)
                console.log("#########" + err)
              }
              next(null, token)
            })
          }
        } else {
          const error = new Error('Access Denied');
          error.statusCode = 403;
          error.code = 'ACCESS_DENIED';
          next(error)
        }
      } else {
        const error = new Error('échec');
        error.statusCode = 401;
        error.code = 'LOGIN_FAILED';
        next(error)
      }

    })
  }
  Profil.remoteMethod('adminLogin', {
    description: 'Login an admin with username or email and password #####',
    accepts: [{
        arg: 'sign_in',
        type: 'string',
        required: true
      },
      {
        arg: 'password',
        type: 'string',
        required: true
      }
    ],
    returns: {
      type: 'object',
      http: {
        source: 'body'
      },
      root: true
    },
    http: {
      verb: 'post',
      path: '/adminLogin'
    }
  });


  const validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  //Send password reset link when requested

  Profil.on('resetPasswordRequest', function (info, next) {
    const Email = app.models.Email
    //send an email with the temporary access token
    Email.send({
      to: info.email,
      from: config.mail.from,
      subject: "Reset Password ",
      template: path.resolve(__dirname, '../../server/templates/reset-password.html'),
      html: `<div>
 Bonjour Mr/Mrs.${info.user.username} <br/>
vous pouvez creer votre nouveau mot de passe via le lien suivant:<br/>
http://localhost:3000/api/Profils/reset-password?access_token=${info.accessToken.id}
 <br/>
  </div>`,
      function (err, Mail) {
        if (err) return next(error)
        next(null, "email sent")
      }
    })
  })
  //Send verification email after registration
  Profil.afterRemote('create', (ctx, profilInstance, next) => {
    var options = {
      type: 'email',
      to: profilInstance.email,
      from: config.mail.from,
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../server/templates/verify.html'),
      // redirect: '/verified' 
    }
    profilInstance.verify(options, (err, response, next) => {
      if (err) {
        next(err)
      }
      //console.log('> verification email sent:', response);

      ctx.res.render('response', {
        title: 'Signed up successfully',
        content: 'Please check your email and click on the verification link ' -
          'before logging in.',
        redirectTo: 'file:///C:/Users/user/MeetingRoomApp/server/templates/verify.html',
        // redirectToLinkText: 'Log in' 
      });
    })
    next(null)
  })
  //Verify uniqueness email
  Profil.observe('before save', function verifyUniquenessEmail(ctx, next) {
    const data = ctx.instance ? ctx.instane : ctx.data
    if (data) {
      Profil.count({
        where: {
          email: data.email
        }
      }, (err, res) => {
        if (err) next(err)
        if (res !== 0) {
          const error = new Error('Email already exists')
          error.statusCode = 422
          error.code = 'EMAIL_ALREADY_EXISTS'
          next()
        } else next()
      })
    } else next()
  })
}
