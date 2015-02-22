var verity = require("verity");
var EasyServer = require("../index");

  // var v;

  // beforeEach(function() {
  //   v = verity(options.url, "GET");
  //   v.jsonMode();
  // });

describe("EasyServer", function() {

  var server;
  function init(options, cb) {
    EasyServer(options, function(created) {
      server = created;
      cb(server);
    });
  }

  function v(port) {
    port = port || 3000;
    var args = Array.prototype.slice.call(arguments, 1);
    var url = "http://localhost:" + [port].concat(args).join("/");
    return verity(url);
  }

  afterEach(function() {
    if (server) {
      server.close();
    }
  });

  it("initializes on the correct port", function(done) {
    init({
      port: 28345, // random port.
      collections: ["users"]
    }, function() {
      v(28345, "users")
        .expectStatus(200)
        .test(done);
    });
  });

  // TODO: Use promises for this stuff to get more familiar with them.

});