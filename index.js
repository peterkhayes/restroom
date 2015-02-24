var express = require("express");
var body    = require("body/json");
var _       = require("lodash");
var q       = require("q");
var morgan  = require("morgan");

var Models = require("./models");

module.exports = function(options) {
  var deferred = q.defer();
  var app = express();
  app.use(morgan('combined'));
  
  /*
    Options and configuration.
  */

  options = options || {};
  var port = options.port || 3000;
  var idField = options.idField || "id";
  var collections = options.collections;
  var auth = options.auth || false;
  var callback = options.callback || function() {};

  /*
    Set up models.
  */

  var models = Models(collections, idField);

  /*
    Set up authentication, if desired.
  */
  
  if (auth) {
    if (_.contains(collections, "session")) {
      throw new Error("Cannot use a session collection if using built-in auth feature");
    }

    // TODO: finish
  }


  /*
    Helper functions
  */

  function sendError(res, status) {
    var msg = Array.prototype.slice.call(arguments, 2).join(" ");
    res.status(status).send({error: msg});
  }

  /*
    Middleware to error on invalid collections.
  */

  function ensureCollection(req, res, next) {
    var collection = req.params.collection;
    var collection2 = req.params.collection2;
    if (!models.exists(collection)) {
      return sendError(res, 400, "Unknown collection:", collection);
    } else if (collection2 && !models.exists(collection2)) {
      return sendError(res, 400, "Unknown collection:", collection2);
    } else if (collection === collection2) {
      return sendError(res, 400, "Cannot associate a collection with itself");
    }
    next();
  }

  /*
    Middleware to fetch an item.
  */

  function fetchItem(req, res, next) {
    var collection = req.params.collection;
    var id = req.params.id;

    var fetched = models.find(collection, id);
    if (!fetched) {
      return sendError(res, 404, "Document not found with collection and identifier:", collection, "/", id);
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
      return res.json(models.getAll(collection));
    })
    .post(parseBody)
    .post(function(req, res) {
      var collection = req.params.collection;
      var id = req.body[idField];
      var output = models.create(collection, data);
      if (!output) {
        return sendError(res, 400, "Duplicated identifier:", id);
      }
      return res.status(201).json(output);
    });

  app.route("/:collection/:id")
    .all(ensureCollection)
    .all(fetchItem)
    .get(function(req, res) {
      return res.json(req.fetched);
    })
    .put(parseBody)
    .put(function(req, res) {
      update(collection, id, newData);
      return res.json(result);
    })
    .delete(function(req, res) {
      var collection = req.params.collection;
      var id = req.params.id;
      models.destroy(collection, id);
      return res.status(204).send();
    });

  app.route("/:collection/:id/:collection2")
    .all(ensureCollection)
    .all(fetchItem)
    .get(function(req, res) {
      var id = req.params.id;
      var collection = req.params.collection;
      var collection2 = req.params.collection2;
      var items = models.findByAssociation(collection, id, collection2);
      return res.json(items);
    })
    .post(parseBody)
    .post(function(req, res) {
      var id = req.params.id;
      var id2 = req.body[idField];
      var collection = req.params.collection;
      var collection2 = req.params.collection2;
      if (!id2) {
        return sendError(res, 400, "Identifier not provided:", idField);
      }

      var success = models.setAssociation(collection, id, collection2, id2);
      if (success) {
        return res.status(204).send();
      } else {
        return sendError(res, 404, "Document not found with collection and identifier:", collection2, "/", id2);
      }
    })
    .delete(function(req, res) {
      var id = req.params.id;
      var collection = req.params.collection;
      var collection2 = req.params.collection2;
      models.removeAssociation(collection, id, collection2);
      return res.status(204).send();
    });

  app.route("/:collection/:id/:collection2/:id2")
    .all(ensureCollection)
    .all(fetchItem)
    .delete(function(req, res) {
      var id = req.params.id;
      var id2 = req.params.id2;
      var collection = req.params.collection;
      var collection2 = req.params.collection2;
      
      var success = models.removeAssociation(collection, id, collection2, id2);
      if (success) {
        return res.status(204).send();
      } else {
        return sendError(res, 404, "Document not found with collection and identifier:", collection2, "/", id2);
      }
    });

  var server = app.listen(port, function() {
    // Allow both promise and callback return style.
    var output = {
      server: server,
      app: app,
      models: models
    };
    
    callback(output);
    deferred.resolve({
      server: server, app: app
    });
  });
  return deferred.promise;
};

// module.exports({
//   port: 3001,
//   collections: ["users", "playlists"],
// });