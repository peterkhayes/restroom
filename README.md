# Restroom

_For a quick, clean, and easy backend._

## Purpose

Restroom lets you spin up fully RESTful HTTP servers with a single command, for use in prototyping, demos, and hackathons.  It provides support for all standard CRUD operations on multiple collections, as well as associations between items.

## Setup
####Basic example:
```javascript
var Restroom = require("restroom");

var collections = ["leviathans", "encyclopaedias", "grandmothers"]
Restroom(collections, function(server, app, models) {
  // you're good to go!
  // app/server are from express
  // server is running on port 3000
  // models gives direct access to the models.
  // use this if you want to pre-load some data, for example.
  // see below.
});
```

#### With optional configuration
```javascript
var Restroom = require("restroom");
Restroom({
  collections: ["tigers", "llamas", "donkeys"],
  port: 1234,
  noLog: true,
  idField: "_id" // field used as unique identifier.  default: "id" 
}, function(server, app, models) {
  // ...
})
```

##API
All methods accept and return bodies in JSON form.
#### GET /collection
Returns all items in the given collection as an array.

#### POST /collection
Creates an item with the data in the request body and adds it to the given collection in storage.  If you provide an id field, it must not match any existing documents in the collection.  If no id field is provided, one will be generated automatically.

#### GET /collection/id
Returns the item in the given collection with the given id.

#### PUT /collection/id
Sets the data of the item in the given collection with the given id to the request body.  Returns the created item.  If an id field is given in the request body, it will be ignored (to prevent ids from changing).

#### PATCH /collection/id
Merges the data of the item in the given collection with the given id with the request body.  If an id field is given in the request body, it will be ignored (to prevent ids from changing).

#### DELETE /collection/id
Deletes the item with the given id in the given collection.  This will clear all associations involving that item.

#### GET /collection1/id/collection2
Returns all items of type collection2 associated with the item in collection1 with the id1.  Note that collection1 and collection2 may be the same - for example, associating a user with another user can represent a friendship.

#### POST /collection1/id1/collection2/id2
Associates the item with id1 in collection1 with the item with id2 in collection2.

#### DELETE /collection1/id/collection2
Removes all associations between the item in collection1 with id1 and items in collection2

#### DELETE /collection1/id1/collection2/id2
Removes the association between the item with id1 in collection1 with the item with id2 in collection2.

##Models Object
The callback to your server returns a `models` object with a variety of methods to manipulate the data in storage.  You may want to use them if you want, for example, a specific fixture scenario to load each time you restart your app.  See the test suite for documentation.