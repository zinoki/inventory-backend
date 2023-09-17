const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; 
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
}

// const errorHandler = (err, req, res, next) => {
//   if (res.headersSent) {
//     return next(err);
//   }
  
//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode);

//   res.json({
//     message: err.message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : null
//   });
// }

// const errorHandler = (err, req, res, next) => {
//   const statusCode = res.statusCode ? res.statusCode : 500
//   res.status(statusCode)

//   res.json({
//     message: err.message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : null
//   })
// }



module.exports = errorHandler;


