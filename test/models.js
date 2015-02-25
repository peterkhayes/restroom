var expect = require("expect.js");
var _      = require("lodash");

var Models = require("../models");

describe("Models", function() {

  var models, collections;

  beforeEach(function() {
    collections = ["tigers", "llamas", "donkeys"];
    models = Models(collections, "id");
  });

  describe("#exists", function() {
    it("determines if a collection exists", function() {
      expect(models.exists("tigers")).to.be(true);
      expect(models.exists("llamas")).to.be(true);
      expect(models.exists("tiger")).to.be(false);
      expect(models.exists("llama")).to.be(false);
    });
  });

  // note: something's gonna have to test the internals.
  // I chose create because then we only have to verify its contents
  // If we tested internals during the find tests, we'd have to set
  // values properly
  describe("#create", function() {
    it("adds an item to storage", function() {
      models.create("tigers", {});
      expect(models._storage.tigers).to.have.length(1);
      expect(models._storage.llamas).to.have.length(0);
    });
    
    it("creates ids for items that lack them", function() {
      // make sure we don't get conficts between lodash-generated ids
      // and ids we explicitly set.
      var uid = _.uniqueId();
      var uid2 = String(Number(uid) + 1);
      var tiger1 = {name: "Tony", id: uid};
      var tiger2 = {name: "Tigger", id: uid2};
      var tiger3 = {name: "Shere Khan"};
      models.create("tigers", tiger1);
      models.create("tigers", tiger2);
      models.create("tigers", tiger3);
      expect(models._storage.tigers[0].id).to.be(uid);
      expect(models._storage.tigers[1].id).to.be(uid2);
      expect(models._storage.tigers[2].id).to.be.a("string");
      expect(models._storage.tigers[2].id).to.not.be(uid);
      expect(models._storage.tigers[2].id).to.not.be(uid2);
    });

    it("returns created item or null if none was created", function() {
      var tiger1 = {name: "Tony", id: "1"};
      var tiger2 = {name: "Tony2", id: "1"};
      var result1 = models.create("tigers", tiger1);
      var result2 = models.create("tigers", tiger2);
      expect(result1).to.eql(tiger1);
      expect(result2).to.eql(null);
    });
  });

  describe("#find", function() {
  });

  describe("#find", function() {
    it("returns an array of all items in collection if no item is given", function() {
      var tiger1 = {name: "Tony"};
      var tiger2 = {name: "Tigger"};
      var tiger3 = {name: "Shere Khan"};
      models.create("tigers", tiger1);
      models.create("tigers", tiger2);
      models.create("tigers", tiger3);

      expect(models.find("tigers")).to.eql([tiger1, tiger2, tiger3]);
      expect(models.find("llamas")).to.eql([]);
    });

    it("returns item with matching id", function() {
      var tiger = {name: "Tony", id: "1"};
      models.create("tigers", tiger);
      expect(models.find("tigers", "1")).to.eql(tiger);
    });

    it("returns null if no item has the given id", function() {
      var tiger = {name: "Tony", id: "1"};
      models.create("tigers", tiger);
      expect(models.find("tigers", "2")).to.be(null);
    });
  });


  describe("updates and removes", function() {

    var tiger, tiger2, tiger3, llama, llama2;

    beforeEach(function() {
      tiger = {name: "Tony", id: "1"};
      tiger2 = {name: "Tigger", id: "2"};
      tiger3 = {name: "Shere Khan", id: "3"};
      llama = {name: "Steve", id: "4"};
      llama2 = {name: "Roger", id: "5"};
      models.create("tigers", tiger);
      models.create("tigers", tiger2);
      models.create("tigers", tiger3);
      models.create("llamas", llama);
      models.create("llamas", llama2);
    });

    describe("#update", function() {
      it("updates any values (except id) of an item", function() {
        models.update("tigers", "1", {name: "Baloney", id: "2", sells: "Sandwiches"});
        expect(models.find("tigers", "1")).to.eql({
          name: "Baloney",
          sells: "Sandwiches",
          id: "1"
        });
      });

      it("returns false if item is not found", function() {
        var result = models.update("tigers", "4",
          {name: "Baloney", id: "2", sells: "Sandwiches"});
        expect(result).to.be(false);
      });
    });

    /*
      Note: I chose not to test findByAssociation because these tests
      are implicit in associate and unassociate.
    */

    describe("#associate", function() {
      it("can set associations between items of different types", function() {
        var result = models.associate("tigers", tiger.id, "llamas", llama.id);
        var result2 = models.associate("tigers", tiger.id, "llamas", llama2.id);
        expect(result).to.be(true);
        expect(result2).to.be(true);
        var llamas = models.findByAssociation("tigers", tiger.id, "llamas");
        expect(llamas).to.eql([llama, llama2]);
        var tigers = models.findByAssociation("llamas", llama.id, "tigers");
        expect(tigers).to.eql([tiger]);
      });

      it("will not double associations between items of different types", function() {
        models.associate("tigers", tiger.id, "llamas", llama.id);
        models.associate("tigers", tiger.id, "llamas", llama.id);
        var found = models.findByAssociation("tigers", tiger.id, "llamas");
        expect(found).to.eql([llama]);
        var found2 = models.findByAssociation("llamas", llama.id, "tigers");
        expect(found2).to.eql([tiger]);
      });

      it("can set associations between items of the same type", function() {
        var result = models.associate("tigers", tiger.id, "tigers", tiger2.id);
        expect(result).to.be(true);
        var found = models.findByAssociation("tigers", tiger.id, "tigers");
        expect(found).to.eql([tiger2]);
        var found2 = models.findByAssociation("tigers", tiger2.id, "tigers");
        expect(found2).to.eql([tiger]);
      });

      it("will not double associations between items of the same type", function() {
        models.associate("tigers", tiger.id, "tigers", tiger2.id);
        models.associate("tigers", tiger.id, "tigers", tiger2.id);

        var found = models.findByAssociation("tigers", tiger.id, "tigers");
        expect(found).to.eql([tiger2]);
        var found2 = models.findByAssociation("tigers", tiger2.id, "tigers");
        expect(found2).to.eql([tiger]);
      });

      it("returns false if either model or collection is missing", function() {
        var result = models.associate("tigers", "missing", "llamas", llama.id);
        var result2 = models.associate("tigers", tiger.id, "llamas", "missing");
        var result3 = models.associate("asdf", tiger.id, "llamas", llama.id);
        var result4 = models.associate("tigers", tiger.id, "asdf", llama.id);
        expect(result).to.be(false);
        expect(result2).to.be(false);
        expect(result3).to.be(false);
        expect(result4).to.be(false);
      });
    });
    
    describe("#destroy", function() {
      it("removes item and any associations and returns true", function() {
        models.associate("tigers", tiger.id, "llamas", llama.id);
        models.associate("tigers", tiger.id, "llamas", llama2.id);
        var result = models.destroy("tigers", tiger.id);
        expect(result).to.be(true);
        expect(models.find("tigers", tiger.id)).to.be(null);
        expect(models.findByAssociation("llamas", llama.id, "tigers")).to.have.length(0);
      });

      it("returns false if id is not found", function() {
        var result = models.destroy("tigers", llama.id);
        expect(result).to.be(false);
        expect(models.find("tigers")).to.have.length(3);
      });
    });

    describe("#unassociate", function() {

      var donkey;

      beforeEach(function() {
        donkey = {name: "Eeyore", id: "10"};
        models.create("donkeys", donkey);
        models.associate("tigers", tiger.id, "llamas", llama.id);
        models.associate("tigers", tiger.id, "llamas", llama2.id);
        models.associate("tigers", tiger.id, "donkeys", donkey.id);
      });

      it("removes one association with four arguments", function() {
        models.unassociate("tigers", tiger.id, "llamas", llama.id);
        var llamas = models.findByAssociation("tigers", tiger.id, "llamas");
        expect(llamas).to.contain(llama2);
        expect(llamas).to.not.contain(llama);
        var donkeys = models.findByAssociation("tigers", tiger.id, "donkeys");
        expect(donkeys).to.contain(donkey);
      });

      it("removes all associations of one type with three arguments", function() {
        models.unassociate("tigers", tiger.id, "llamas");
        var llamas = models.findByAssociation("tigers", tiger.id, "llamas");
        expect(llamas).to.have.length(0);
        var donkeys = models.findByAssociation("tigers", tiger.id, "donkeys");
        expect(donkeys).to.contain(donkey);
      });

      it("removes all associations with two arguments", function() {
        models.unassociate("tigers", tiger.id);
        var llamas = models.findByAssociation("tigers", tiger.id, "llamas");
        expect(llamas).to.have.length(0);
        var donkeys = models.findByAssociation("tigers", tiger.id, "donkeys");
        expect(donkeys).to.have.length(0);
      });
    });
  });


});