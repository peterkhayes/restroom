var q          = require("q");
var superagent = require("superagent");

function req(method, url, data) {
  var p = q.defer();
  superagent[method](url)
    .send(data || {})
    .end(function(res) {
      if (res.status >= 200 && res.status < 300) {
        return p.resolve(res);
      } else {
        return p.reject(res);
      }
    });
  return p.promise;
}

module.exports = {

  get: req.bind(req, "get"),
  post: req.bind(req, "post"),
  put: req.bind(req, "put"),
  del: req.bind(req, "del")
  
};