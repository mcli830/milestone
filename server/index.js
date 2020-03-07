require('dotenv').config();
const path = require('path');
const morgan = require('morgan');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const createError = require('http-errors');
const http = require('http');
const passport = require('passport');
const session = require('express-session');
const sessionStore = new session.MemoryStore();
// import from server
const apiRouter = require('./routes/api');
const configAuthStrategies = require('./auth/strategies');

const port = process.env.SERVER_PORT || 8080;
const app = express();
const server = http.createServer(app);

// expose static angular app files
app.use(express.static(path.resolve(process.cwd(), 'dist'), {
  index: false, // prevents express from automatically serving index.html
}));
// express logger
app.use(morgan('dev'));
// header security
app.use(helmet());
// parse cookies and request body
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
// PUT/PATCH, DELETE support for some browsers
app.use(methodOverride());
// configure session
app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));
// initialize passport with session
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use('/api', apiRouter);

// catch all and send to angular app at dist/index.html
app.get('*', (req,res) => {
  res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
});

// catch 404  
app.use((req,res,next) => {
  next(createError(404));
})

// error handler
app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(500);
  res.json({ status: 500, error: err });
});

// connect to database
console.log('Connecting to database...');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
}).then(() => {
  console.log('Database connection established.');

  // configure authentication strategies once database is connected
  configAuthStrategies();

  // start server
  server.listen(port, () => {
    console.log(`Server listening on port ${port}...`);
  });

}).catch(err => {
  console.error.bind(console, err);
  process.exit(-1);
});
