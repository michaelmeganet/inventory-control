(function() {
  var proxy_buffer;

  proxy_buffer = function(httpProxy) {
    if (httpProxy == null) throw "HTTP proxy must be supplied";
    return function(req, res, next) {
      req.buffer = httpProxy.buffer(req);
      return next();
    };
  };

  module.exports = proxy_buffer;

}).call(this);
