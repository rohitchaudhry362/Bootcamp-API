const express = require('express');
const dotenv = require('dotenv');
const logger = require('./middleware/logger');
const morgan = require('morgan');
const connectDB = require('./config/db');
const colors = require('colors');
const errorHandler = require('./middleware/error');

// Load ENV variables
dotenv.config({path:'./config/config.env'});

// Connect to database
connectDB();

//Route files
const bootcamps = require('./routes/bootcamps');


const app = express();

// Body Parser
app.use(express.json());

// app.use(logger);

// Dev logging middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}


// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use(errorHandler);

const PORT = process.env.PORT || 5000; 

const server = app.listen(
    PORT, 
    console.log(
        `Server running on port ${PORT} and in ${process.env.NODE_ENV} mode`
    .yellow.bold
    )
);

// Code for unhandled promise rejections
process.on('unhandledRejection',(err,promise) => {
    console.log(`Error: ${err.message}`.red);
    // Close Server and Exit Process
    server.close(() => {
        process.exit(1);
    })
})