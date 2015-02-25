var _          = require('lodash');
var EasyServer = require("../index");
var verity     = require("./verity");
var expect     = require("expect.js");

describe("EasyServer", function() {

  var server, app, models;

  var tiger, tiger2, tiger3;
  var llama, llama2;
  var donkey;

  beforeEach(function(done) {
    EasyServer({
      collections: ["tigers", "llamas", "donkeys", "artichokes"],
      noLog: true
    }, function(s, a, m) {
      server = s;
      app = a;
      models = m;

      tiger = {name: "Tony", id: "1"};
      tiger2 = {name: "Tigger", id: "2"};
      tiger3 = {name: "Shere Khan", id: "3"};
      llama = {name: "Steve", id: "4"};
      llama2 = {name: "Roger", id: "5"};
      donkey = {name: "Eeyore", id: "6"};
      
      models.create("tigers", tiger);
      models.create("tigers", tiger2);
      models.create("tigers", tiger3);
      models.create("llamas", llama);
      models.create("llamas", llama2);
      models.create("donkeys", donkey);

      /*
        Associations:
          tiger - llama
          tiger - llama2
          tiger2 - llama
          tiger2 - donkey
          tiger - tiger3
      */ 
      models.associate("tigers", tiger.id, "llamas", llama.id);
      models.associate("tigers", tiger.id, "llamas", llama2.id);
      models.associate("tigers", tiger2.id, "llamas", llama.id);
      models.associate("tigers", tiger2.id, "donkeys", donkey.id);
      models.associate("tigers", tiger.id, "tigers", tiger3.id);

      done();
    });
  });

  afterEach(function(done) {
    if (server) {
      server.close(done);
    }
  });

  it("initializes on the correct port", function(done) {
    server.close();
    EasyServer({
      port: 1234,
      collections: ["users"],
      noLog: true
    }, function(s) {
      server = s;
      verity(1234, "users")
      .expectStatus(200)
      .test(done);
    });
  });

  describe("GET /collection", function() {
    it("400 if collection doesn't exist", function(done) {
      verity("elephants")
      .expectStatus(400)
      .test(done);
    });

    it("200 with no items if collection is empty", function(done) {
      verity("artichokes")
      .expectStatus(200)
      .expectBody([])
      .test(done);
    });

    it("200 with items if collection has items", function(done) {
      verity("tigers")
      .expectStatus(200)
      .expectBody([tiger, tiger2, tiger3])
      .test(done);
    });
  });

  describe("POST /collection", function() {
    it("400 if collection doesn't exist", function(done) {
      verity("elephants")
      .method("POST")
      .expectStatus(400)
      .test(done);
    });

    it("400 with duplicate id", function(done) {
      verity("tigers")
      .method("POST")
      .body({id: tiger.id, name: "Richard Parker"})
      .expectStatus(400)
      .test(done);
    });

    it("201 and creates an id if none is given", function(done) {
      verity("tigers")
      .method("POST")
      .body({name: "Richard Parker"})
      .expectStatus(201)
      .expect(function(res) {
        expect(res.body.id).to.be.a("string");
        expect(res.body.name).to.be("Richard Parker");
      })
      .expect(function(res) {
        expect(models.find("tigers", res.body.id)).to.have.property("name", "Richard Parker");
      })
      .test(done);
    });

    it("201 with given id", function(done) {
      var body = {name: "Richard Parker", id: "asdf"};
      verity("tigers")
      .method("POST")
      .body(body)
      .expectStatus(201)
      .expectBody(body)
      .expect(function(res) {
        expect(models.find("tigers", body.id)).to.eql(body);
      })
      .test(done);
    });
  });

  describe("GET /collection/id", function() {
    it("400 if collection doesn't exist", function(done) {
      verity("elephants", tiger.id)
      .expectStatus(400)
      .test(done);
    });

    it("404 if no item exists with that id", function(done) {
      verity("llamas", tiger.id)
      .expectStatus(404)
      .test(done);
    });

    it("200 with item", function(done) {
      verity("llamas", llama.id)
      .expectStatus(200)
      .expectBody(llama)
      .test(done);
    });
  });

  describe("PUT /collection/id", function() {
    it("400 if collection doesn't exist", function(done) {
      verity("elephants", tiger.id)
      .method("PUT")
      .expectStatus(400)
      .test(done);
    });
  });
});






