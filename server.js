// server.js
const express = require('express');
const cors = require('cors');
const router = express.Router();
const path = require('path');
require('./config/connect');
const answersRoute = require('./controllers/answers.js');
const userRoute = require('./controllers/user.js');
const testRoute = require('./controllers/test.js');
const cvRoute = require('./controllers/cv.js');
const feedbackRoute = require('./controllers/Feedback.js');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static Files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/Cv', express.static(path.join(__dirname, 'Cv')));
app.use('/logo', express.static(path.join(__dirname, 'logo')));

// Routes
app.use('/user', userRoute);
app.use('/test', testRoute);
app.use('/cv', cvRoute);
app.use('/feedback', feedbackRoute);
app.use('/answer', answersRoute);

// Handle Preflight Requests
app.options('*', cors());

// 404 Handler (Optional)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler (Optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the Server
const PORT =3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
