var Verity  = require("verity");
var _ = require("lodash");

// Makes a verity for localhost on the given port and with any
// other args as the path.
module.exports = function () {
  var args = Array.prototype.slice.call(arguments);
  if (!_.isNumber(args[0])) {
    args.unshift(3000);
  }
  var url = "http://localhost:" + args.join("/");
  return Verity(url).jsonMode();
};
