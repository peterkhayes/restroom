var express = require("express");
var body    = require("body/json");
var _       = require("lodash");

module.exports = function(options) {
  var app = express();

  /*
    Options and configuration.
  */

  options = options || {};
  var port = options.port || 3000;
  var idField = options.idField || "id";
  var collections = options.collections;

  /*
    Set up storage collections.
  */

  var storage = {};
  if (!collections) {
    throw new Error("Must pass an array of collection names as `options.collections`");
  }
  collections.forEach(function(collection) {
    storage[collection] = [];
  });

  /*
    Helper functions
  */

  function findById(collection, id) {
    var query = {};
    query[idField] = id;
    return _.findWhere(storage[collection], query);
  }

  function sendError(res, status) {
    var msg = Array.prototype.slice.call(arguments, 2).join(" ");
  }

  /*
    Middleware to error on invalid collections.
  */

  app.use(function(req, res, next) {
    var collection = req.params.collection;
    if (!storage[collection]) {
      return sendError(res, 400, "Unknown collection:", collection);
    }
    next();
  });

  /*
    Middleware to fetch an item for member GET, PUT, and DELETE
  */

  app.use(function(req, res, next) {
    var collection = req.params.collection;
    var id = req.params.id;
    if (!id) {
      return next();
    }

    var fetched = findById(collection, id);
    if (!fetched) {
      return sendError(res, 404, "Document not found with identifier:", idField, "-", id);
    }
    req.fetched = fetched;
    next();
  });

  /*
    Body-parsing middleware for POST and PUT.
  */

  app.use(function(req, res, next) {
    if (req.method === "POST" || req.method === "PUT") {
      body(req, res, function(err, body) {
        if (err) {
          return sendError(res, 500, "Body parsing error");
        }
        req.body = body;
        next();
      });
    }
  });


  /*
    Collection GET: retrieve all members of a collection.
  */

  app.get("/:collection", function(req, res) {
    var collection = req.params.collection;
    return res.json(storage[collection]);
  });

  /*
    Collection POST: add a member to a collection.
  */

  app.post("/:collection", function(req, res) {
    var collection = req.params.collection;
    var id = data[idField];
    if (!id) {
      return sendError(res, 400, "Identifier not provided:", idField);
    }
    
    if (findById(collection, id)) {
      return sendError(res, 400, "Duplicated identifier:", idField, "-", id);
    }
    
    storage[collection].push(data);
    return res.status(201).json(data);
  });

  app.get("/:collection/:id", function(req, res) {
    return res.json(req.fetched);
  });

  app.put("/:collection/:id", function(req, res) {
    if (req.body[idField]) {
      return sendError(res, 400, "Cannot edit identifier:", idField);
    }
    _.extend(req.fetched, req.body);
    return res.json(req.fetched);
  });

  app.delete("/:collection/:id", function(req, res) {
    var collection = req.params.collection;
    var id = data[idField];
    storage[collection] = storage[collection].filter(function(item) {
      return item[idField] != id;
    });
    return res.status(204).send();
  });

  app.listen(port, function() {
    console.log("Basic server listening on port", port);
  });
};