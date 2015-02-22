var _          = require('lodash');
var EasyServer = require("../index");
var verity     = require("./verity");
var http       = require("./http");
  // var v;

  // beforeEach(function() {
  //   v = verity(options.url, "GET");
  //   v.jsonMode();
  // });

describe("EasyServer", function() {

  var server;

  afterEach(function() {
    if (server) {
      server.close();
    }
  });

  function saveServer(created) {
    server = created;
    return created;
  }

  it("initializes on the correct port", function() {
    var p = EasyServer({
      port: 1234,
      collections: ["users"]
    })
    .then(saveServer)
    .then(function() {
      return verity(28345, "users").expectStatus(200).test();
    })
    .fail(function(err) {
      console.log("err", err);
      done(err);
    });

    console.log(Object.keys(p));
    return p.promise;
  });

  // TODO: Use promises for this stuff to get more familiar with them.

});