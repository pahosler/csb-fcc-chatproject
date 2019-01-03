'use strict'

require('dotenv').config()
const fs = require('fs')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const fccTesting = require('./freeCodeCamp/fcctesting.js')
const auth = require('./app/auth.js')
const routes = require('./app/routes.js')
const mongo = require('mongodb').MongoClient
const passport = require('passport')
const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')
const app = express()
const emojis = require('emojis')
const cors = require('cors')
const http = require('http').Server(app)
const sessionStore = new session.MemoryStore()
const server = require('http').createServer(app)
const io = require('socket.io')(http)

fs.readdir(process.cwd() + '/src/public', (err, files) => {
  console.log(err || files)
})
// var currentUsers = 0
var ninetyDaysInMilliseconds = 90 * 24 * 60 * 60 * 1000
app.use(cors())
app.use(
  helmet({
    frameGuard: {
      action: 'deny'
    },
    constentSecurityPolicy: {
      directive: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'trusted-cdn.com']
      }
    },
    dnsPreFetchControl: false,
    maxAge: ninetyDaysInMilliseconds,
    ieNoOpen: true,
    noSniff: true,
    xxsFilter: true,
    hidePoweredBy: {
      setTo: 'PHP 4.2.0'
    }
  })
)

fccTesting(app) //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/src/public'))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'pug')

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    key: 'express.sid',
    store: sessionStore
  })
)

mongo.connect(
  process.env.DATABASE,
  { useNewUrlParser: true },
  (err, client) => {
    var db = client.db(process.env.DBNAME)
    if (err) {
      console.log('Database error: ' + err)
    } else {
      console.log('Successful database connection')

      auth(app, db)
      routes(app, db)

      http.listen(process.env.PORT || 8080)

      //start socket.io code

      io.use(
        passportSocketIo.authorize({
          cookieParser: cookieParser,
          key: 'express.sid',
          secret: process.env.SESSION_SECRET,
          store: sessionStore
        })
      )

      let currentUsers = 0

      io.on('connection', socket => {
        console.log('A user has connected')
        ++currentUsers
        io.emit('user count', currentUsers)
        console.log('user ' + socket.request.user.name + ' connected')

        socket.on('disconnect', () => {
          --currentUsers
          console.log('ta ta for now!')
        })

        socket.on('chat message', function(message) {
          message = message.replace('<', '&lt;').replace('>', '&gt;')
          io.emit(
            'chat message',
            emojis.html(
              `${socket.request.user.name}: ${message}`,
              `${process.env.EMOJI}/`
            )
          )
        })

        io.emit('user', {
          name: socket.request.user.name,
          currentUsers,
          connected: true
        })
      })
    } // else end
  }
)
