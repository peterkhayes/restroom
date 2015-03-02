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

    it("404 if item doesn't exist", function(done) {
      verity("llamas", tiger.id)
      .method("PUT")
      .expectStatus(404)
      .test(done);
    });

    it("200 and resets data (except id)", function(done) {
      verity("tigers", tiger.id)
      .method("PUT")
      .body({id: "-100", key: "val"})
      .expectStatus(200)
      .expectBody({
        id: tiger.id,
        key: "val"
      })
      .expect(function() {
        expect(models.find("tigers", tiger.id)).to.eql({
          id: tiger.id,
          key: "val"
        });
      })
      .test(done);
    });
  });

  describe("PATCH /collection/id", function() {
    it("400 if collection doesn't exist", function(done) {
      verity("elephants", tiger.id)
      .method("PATCH")
      .expectStatus(400)
      .test(done);
    });

    it("404 if item doesn't exist", function(done) {
      verity("llamas", tiger.id)
      .method("PATCH")
      .expectStatus(404)
      .test(done);
    });

    it("200 and resets data (except id)", function(done) {
      verity("tigers", tiger.id)
      .method("PATCH")
      .body({id: "-100", key: "val"})
      .expectStatus(200)
      .expectBody({
        id: tiger.id,
        name: tiger.name,
        key: "val"
      })
      .expect(function() {
        expect(models.find("tigers", tiger.id)).to.eql({
          id: tiger.id,
          name: tiger.name,
          key: "val"
        });
      })
      .test(done);
    });
  });

  describe("DELETE /collection/id", function() {
    it("400 if collection doesn't exist", function(done) {
      verity("elephants", tiger.id)
      .method("DELETE")
      .expectStatus(400)
      .test(done);
    });

    it("404 if item doesn't exist", function(done) {
      verity("llamas", tiger.id)
      .method("DELETE")
      .expectStatus(404)
      .test(done);
    });

    it("204 and removes item", function(done) {
      verity("tigers", tiger.id)
      .method("DELETE")
      .expectStatus(204)
      .expect(function() {
        expect(models.find("tigers", tiger.id)).to.be(null);
      })
      .test(done);
    });
  });

  describe("GET /collection1/id/collection2", function() {
    it("400 if collection1 doesn't exist", function(done) {
      verity("elephants", tiger.id, "tigers")
      .expectStatus(400)
      .test(done);
    });

    it("400 if collection2 doesn't exist", function(done) {
      verity("tigers", tiger.id, "elephants")
      .expectStatus(400)
      .test(done);
    });

    it("404 if item doesn't exist", function(done) {
      verity("tigers", llama.id, "llamas")
      .expectStatus(404)
      .test(done);
    });

    it("200 with list of associated items", function(done) {
      verity("tigers", tiger.id, "llamas")
      .expectStatus(200)
      .expectBody([
        {
          "name": "Steve",
          "id": "4"
        },
        {
          "name": "Roger",
          "id": "5"
        }
      ])
      .test(done);
    });
  });

  describe("DELETE /collection1/id/collection2", function() {
    it("400 if collection1 doesn't exist", function(done) {
      verity("elephants", tiger.id, "tigers")
      .method("DELETE")
      .expectStatus(400)
      .test(done);
    });

    it("400 if collection2 doesn't exist", function(done) {
      verity("tigers", tiger.id, "elephants")
      .method("DELETE")
      .expectStatus(400)
      .test(done);
    });

    it("404 if item doesn't exist", function(done) {
      verity("tigers", llama.id, "llamas")
      .method("DELETE")
      .expectStatus(404)
      .test(done);
    });

    it("204 and removes all associations", function(done) {
      verity("tigers", tiger.id, "llamas")
      .method("DELETE")
      .expectStatus(204)
      .expect(function() {
        var associated = models.findByAssociation("tigers", tiger.id, "llamas");
        expect(associated).to.have.length(0);
      })
      .test(done);
    });
  });

  describe("POST /collection1/id1/collection2/id2", function() {
    it("400 if collection1 doesn't exist", function(done) {
      verity("elephants", tiger.id, "tigers", llama.id)
      .method("POST")
      .expectStatus(400)
      .test(done);
    });

    it("400 if collection2 doesn't exist", function(done) {
      verity("tigers", tiger.id, "elephants", llama.id)
      .method("POST")
      .expectStatus(400)
      .test(done);
    });

    it("404 if item1 doesn't exist", function(done) {
      verity("tigers", llama.id, "llamas", llama2.id)
      .method("POST")
      .expectStatus(404)
      .test(done);
    });

    it("404 if item2 doesn't exist", function(done) {
      verity("tigers", tiger.id, "llamas", tiger2.id)
      .method("POST")
      .expectStatus(404)
      .test(done);
    });

    it("204 and associates the two items", function(done) {
      verity("tigers", tiger3.id, "llamas", llama.id)
      .method("POST")
      .expectStatus(200)
      .expect(function() {
        var llamas = models.findByAssociation("tigers", tiger3.id, "llamas");
        expect(_.pluck(llamas, "id")).to.contain(llama.id);
        var tigers = models.findByAssociation("llamas", llama.id, "tigers");
        expect(_.pluck(tigers, "id")).to.contain(tiger3.id);
      })
      .test(done);
    });
  });

  describe("DELETE /collection1/id1/collection2/id2", function() {
    it("400 if collection1 doesn't exist", function(done) {
      verity("elephants", tiger.id, "tigers", llama.id)
      .method("DELETE")
      .expectStatus(400)
      .test(done);
    });

    it("400 if collection2 doesn't exist", function(done) {
      verity("tigers", tiger.id, "elephants", llama.id)
      .method("DELETE")
      .expectStatus(400)
      .test(done);
    });

    it("404 if item1 doesn't exist", function(done) {
      verity("tigers", llama.id, "llamas", llama2.id)
      .method("DELETE")
      .expectStatus(404)
      .test(done);
    });

    it("404 if item2 doesn't exist", function(done) {
      verity("tigers", tiger.id, "llamas", tiger2.id)
      .method("DELETE")
      .expectStatus(404)
      .test(done);
    });

    it("204 and removes association", function(done) {
      verity("tigers", tiger.id, "llamas", llama.id)
      .method("DELETE")
      .expectStatus(204)
      .expect(function() {
        var llamas = models.findByAssociation("tigers", tiger.id, "llamas");
        expect(_.pluck(llamas, "id")).to.not.contain(llama.id);
        var tigers = models.findByAssociation("llamas", llama.id, "tigers");
        expect(_.pluck(tigers, "id")).to.not.contain(tiger.id);
      })
      .test(done);
    });
  });
});






