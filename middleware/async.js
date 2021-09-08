const asyncHandler = fn => (req, res, next) => {
    Promise
        .resolve(fn(req,res,next))
        .catch(next)
}

/*
function asyncHandler(fn) {
  function inner(req, res, next) {
    return Promise
            .resolve(fn(req, res, next))
            .catch(next);
  };
  return inner;
}
*/

module.exports = asyncHandler;