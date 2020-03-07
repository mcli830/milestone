require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
// import routes
const apiRouter = require('./routes/api');

const port = process.env.SERVER_PORT || 8080;

const app = express();

// connect to database
console.log('Connecting to database server...');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: true,
}).then(() => {
  console.log('Connection to database established.');
}).catch(err => {
  console.error(err);
  process.exit(-1);
});

// expose static angular app files
app.use(express.static(path.resolve(process.cwd(), 'dist'), {
  index: false, // prevents express from automatically serving index.html
}));
// express logger
app.use(morgan('dev'));
// parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
// PUT/PATCH, DELETE support for some browsers
app.use(methodOverride());

// routes
app.use('/api', apiRouter);

// catch all and send to angular app at dist/index.html
app.get('*', (req,res) => {
  res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
});

// error handler
app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(500).send(err.message);
});

// start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
