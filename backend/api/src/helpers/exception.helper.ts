const Layer = require("express/lib/router/layer.js");

const addCustomAsyncErrorHandler = () => {
  Layer.prototype.handle_request = function handle(
    req: any,
    res: any,
    next: any
  ) {
    var fn = this.handle;

    if (fn.length > 3) {
      // not a standard request handler
      return next();
    }

    try {
      Promise.resolve(fn(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
};

export default addCustomAsyncErrorHandler;
