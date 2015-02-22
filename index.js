var express = require("express");
var body    = require("body/json");
var _       = require("lodash");
var q       = require("q");
var morgan  = require("morgan");

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

  /*
    Set up storage collections.
  */

  var storage = {};
  if (!_.isArray(collections) || collections.length === 0) {
    throw new Error("Must pass an array of collection names as `options.collections`");
  }
  collections.forEach(function(collection) {
    storage[collection] = [];
  });
  var associations = [];

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

  function findById(collection, id) {
    var query = {};
    query[idField] = id;
    return _.findWhere(storage[collection], query);
  }

  function sendError(res, status) {
    var msg = Array.prototype.slice.call(arguments, 2).join(" ");
    res.status(status).send({error: msg});
  }

  function setAssociation(type1, id1, type2, id2) {
    var obj = {};
    obj[type1] = id1;
    obj[type2] = id2;
    associations.push(obj);
  }

  function getAssociations(type1, id1, type2) {
    return associations.filter(function(a) {
      return a[type1] === id1 && a[type2] !== undefined;
    });
  }

  function removeAssociation(type1, id1, type2, id2) {
    if (id2) {
      associations = associations.filter(function(a) {
        return !(a[type1] === id1 && a[type2] === id2);
      });
    } else {
      associations = associations.filter(function(a) {
        return !(a[type1] === id1 && a[type2] !== undefined);
      });
    }
  }

  /*
    Middleware to error on invalid collections.
  */

  function ensureCollection(req, res, next) {
    var collection = req.params.collection;
    var collection2 = req.params.collection2;
    if (!storage[collection]) {
      return sendError(res, 400, "Unknown collection:", collection);
    } else if (collection2 && !storage[collection2]) {
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
    if (!id) {
      return next();
    }

    var fetched = findById(collection, id);
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
    .get(function(req, res) {
      return res.json(req.fetched);
    })
    .put(parseBody)
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

  app.route("/:collection/:id/:collection2")
    .all(ensureCollection)
    .all(fetchItem)
    .get(function(req, res) {
      var id = req.params.id;
      var collection = req.params.collection;
      var collection2 = req.params.collection2;
      var associations = getAssociations(collection, id, collection2);
      var found = associations.map(function(a) {
        return findById(collection2, a[collection2]);
      });
      return res.json(found);
    })
    .post(parseBody)
    .post(function(req, res) {
      var id = req.params.id;
      var id2 = req.body[idField];
      var collection = req.params.collection;
      var collection2 = req.params.collection2;
      if (!id) {
        return sendError(res, 400, "Identifier not provided:", idField);
      }
      if (!findById(collection2, id2)) {
        return sendError(res, 404, "Document not found with collection and identifier:", collection2, "/", id2);
      }
      setAssociation(collection, id, collection2, id2);
      return res.status(204).send();
    })
    .delete(function(req, res) {
      var id = req.params.id;
      var collection = req.params.collection;
      var collection2 = req.params.collection2;
      removeAssociation(collection, id, collection2);
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
      if (!findById(collection2, id2)) {
        return sendError(res, 404, "Document not found with collection and identifier:", collection2, "/", id2);
      }
      removeAssociation(collection, id, collection2, id2);
      return res.status(204).send();
    });

  var server = app.listen(port, function() {
    return deferred.resolve(server);
  });
  return deferred.promise;
};

// module.exports({
//   port: 3001,
//   collections: ["users", "playlists"],
// });