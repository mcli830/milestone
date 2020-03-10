require('dotenv').config();
const path = require('path');
const morgan = require('morgan');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const createError = require('http-errors');
const http = require('http');
// import routers
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');

const port = process.env.SERVER_PORT || 8080;
const app = express();
const server = http.createServer(app);

/* MIDDLEWARE */

// expose static angular app files
app.use(express.static(path.resolve(process.cwd(), 'dist'), {
  index: false, // prevents express from automatically serving index.html
}));
// express logger
app.use(morgan('dev'));
// security
app.use(helmet());
app.use(cors());
// parse cookies and request body
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
// PUT/PATCH, DELETE support for some browsers
app.use(methodOverride());

/* ROUTING */

app.use('/auth', authRouter);
app.use('/api', apiRouter);

// send angular app index if no routes match
// angular will handle app routing
app.get('*', (req,res) => {
  res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
});

// catch 404
app.use((req,res,next) => {
  next(createError(404));
})

// central error handler
app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(500).send(err);
});

/* DATABASE CONNECTION */

console.log('Connecting to database...');
// connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
}).then(() => {
  console.log('Database connection established.');

  // start server
  server.listen(port, () => {
    console.log(`Server listening on port ${port}...`);
  });

}).catch(err => {
  console.error.bind(console, err);
  process.exit(-1);
});
