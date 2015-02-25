var _ = require("lodash");

/*
  TODO: Change interface to use callbacks, so support for redis/mongo
  can be added easily later.
*/


module.exports = function(collections, idField) {

  var storage = {};
  var associations = [];
  var selfAssociations = {};

  if (!_.isArray(collections) || collections.length === 0) {
    throw new Error("Must pass an array of collection names as `options.collections`");
  }
  collections.forEach(function(collection) {
    storage[collection] = [];
    selfAssociations[collection] = [];
  });

  var models = {};

  models.exists = function(collection) {
    return Boolean(storage[collection]);
  };

  models.create = function(collection, data) {
    if (data[idField] === undefined) {
      do {
        data[idField] = _.uniqueId();
      } while (models.find(collection, data[idField]));
    } else if (models.find(collection, data[idField])) {
      return null;
    }
    storage[collection].push(data);
    return data;
  };

  models.findAll = function(collection) {
    return storage[collection];
  };

  models.find = function(collection, id) {
    if (!id) { return null; }
    var query = {};
    query[idField] = id;
    return _.findWhere(storage[collection], query) || null;
  };

  models.update = function(collection, id, newData) {
    var item = models.find(collection, id);
    if (!item) {
      return false;
    }
    delete newData[idField];
    _.extend(item, newData);
    return item;
  };

  models.associate = function(type1, id1, type2, id2) {
    if (!models.find(type1, id1)) return false;
    if (!models.find(type2, id2)) return false;
    
    var obj, target;
    if (type1 !== type2) {
      obj = {};
      obj[type1] = id1;
      obj[type2] = id2;
      target = associations;
    } else {
      obj = [id1, id2].sort();
      target = selfAssociations[type1];
    }

    if (!_.findWhere(target, obj)) {
      target.push(obj);
    }
    return true;
  };

  models.findByAssociation = function(type1, id1, type2) {
    if (type1 !== type2) {
      return associations.filter(function(a) {
        return a[type1] === id1 && a[type2] !== undefined;
      }).map(function(a) {
        return models.find(type2, a[type2]);
      }).filter(Boolean);
    
    } else {
      return _(selfAssociations[type1]).filter(function(a) {
        return _.contains(a, id1);
      }).flatten().omit(function(id) {
        return id === id1;
      })
      .map(function(id) {
        return models.find(type1, id);
      }).filter(Boolean).value();
    }
  };

  models.destroy = function(collection, id) {
    var item = models.find(collection, id);
    if (!item) {
      return false;
    }
    storage[collection] = storage[collection].filter(function(item) {
      return item[idField] !== id;
    });
    models.unassociate(collection, id);
    return true;
  };

  models.unassociate = function(type1, id1, type2, id2) {
    if (id2) {
      if (!models.find(type2, id2)) return false;
      if (type1 !== type2) {
        associations = associations.filter(function(a) {
          return (a[type1] !== id1 || a[type2] !== id2);
        });
      } else {
        var target = [id1, id2].sort();
        selfAssociations[type1] = selfAssociations[type1].filter(function(a) {
          return a[0] !== target[0] || a[1] !== target[1];
        });
      }
    } else if (type2) {
      if (type1 !== type2) {
        associations = associations.filter(function(a) {
          return (a[type1] !== id1 || a[type2] === undefined);
        });
      } else {
        selfAssociations[type1] = selfAssociations[type1].filter(function(a) {
          return !_.contains(id1);
        });
      }
    } else {
      if (type1 !== type2) {
        associations = associations.filter(function(a) {
          return (a[type1] !== id1);
        });
      } else {
        selfAssociations[type1] = selfAssociations[type1].filter(function(a) {
          return !_.contains(id1);
        });
      }
    }
    return true;
  };

  models._storage = storage;
  models._associations = associations;

  return models;
};


