var Verity  = require("verity");
var q       = require("q");

var oldTest = Verity.prototype.test;

Verity.prototype.test = function() {
  var p = q.defer();
  oldTest.call(this, function(err, results) {
    if (err) {
      console.log("rejecting");
      return p.reject(err);
    } else {
      return p.resolve(results);
    }
  });
  return p.promise;
};


// Makes a verity for localhost on the given port and with any
// other args as the path.
module.exports = function (port) {
  port = port || 3000;
  var args = Array.prototype.slice.call(arguments, 1);
  var url = "http://localhost:" + [port].concat(args).join("/");
  return Verity(url);
};
