var express = require("express");
var body    = require("body/json");
var _       = require("lodash");
var morgan  = require("morgan");

module.exports = function(options) {
  var app = express();
  app.use(morgan('combined'));
  
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
    res.status(status).send({error: msg});
  }

  /*
    Middleware to error on invalid collections.
  */

  function ensureCollection(req, res, next) {
    var collection = req.params.collection;
    if (!storage[collection]) {
      return sendError(res, 400, "Unknown collection:", collection);
    }
    next();
  }

  /*
    Middleware to fetch an item.
  */

  function fetchItem(req, res, next) {
    var collection = req.params.collection;
    var id = req.params.id;
    if (!id) {
      return next();
    }

    var fetched = findById(collection, id);
    if (!fetched) {
      return sendError(res, 404, "Document not found with identifier:", idField, "/", id);
    }
    req.fetched = fetched;
    next();
  }

  /*
    Body-parsing middleware for POST and PUT.
  */

  function parseBody(req, res, next) {
    if (req.method === "POST" || req.method === "PUT") {
      body(req, res, function(err, body) {
        if (err) {
          return sendError(res, 500, "Body parsing error:", (err.message || err));
        }
        req.body = body;
        next();
      });
    } else {
      next();
    }
  }

  app.route("/:collection")
    .all(ensureCollection)
    .get(function(req, res) {
      var collection = req.params.collection;
      return res.json(storage[collection]);
    })
    .post(parseBody)
    .post(function(req, res) {
      var collection = req.params.collection;
      var id = req.body[idField];
      if (!id) {
        return sendError(res, 400, "Identifier not provided:", idField);
      }
      
      if (findById(collection, id)) {
        return sendError(res, 400, "Duplicated identifier:", idField, "/", id);
      }
      
      storage[collection].push(req.body);
      return res.status(201).json(req.body);
    });

  app.route("/:collection/:id")
    .all(ensureCollection)
    .all(fetchItem)
    .put(parseBody)
    .get(function(req, res) {
      return res.json(req.fetched);
    })
    .put(function(req, res) {
      delete req.body[idField];
      _.extend(req.fetched, req.body);
      return res.json(req.fetched);
    })
    .delete(function(req, res) {
      var collection = req.params.collection;
      var id = req.params.id;
      storage[collection] = storage[collection].filter(function(item) {
        return item[idField] != id;
      });
      return res.status(204).send();
    });

  var server = app.listen(port, function() {
    console.log("Basic server listening on port", port);
  });
};

module.exports({
  port: 3001,
  collections: ["users", "playlists"]
});