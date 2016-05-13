var http = require("http");
var pathO = require('path');
var FS = require('fs');
const SERVER_PORT = 8888;
const DB_PORT = "27017";

var allFiles = [
   'index.html'
];

var server = http.createServer( function(req, res) {
  if (req.method.toLowerCase() == 'get') {
    if(req.url=='/index.html' || req.url=='/') {
      sendFiles(res, "index.html");
    }
    if(req.url=='/sc1.js') {
      sendFiles(res,"sc1.js");
    }
    if(req.url=='/main.css') {
      sendFiles(res,"main.css");
    }
    if(req.url=='/favicon.ico') {
      sendFiles(res,"favicon.ico");

    }
    if(req.url=='/circles1.svg') {
      sendFiles(res,"circles1.svg");
    }

  } else if (req.method.toLowerCase() == 'post') {
    // console.log('got a Post');
    req.on('data', function(stuff) {
      var x = MultiPart_parse(stuff.toString(), req.headers['content-type']);
      Object.keys(x).forEach(function(key) {
        console.log(key);
        console.log(x[key]);
      });
    });
  }
})
server.listen(SERVER_PORT);



function sendFiles(res, fileName) {
    FS_readFiles(fileName, function (extn, data) {
        console.log(extn);
        if (extn === '.js') {
          var contentType = "{Content-Type : application/javascript}"
        }
        else if (extn === '.svg') {
          var contentType = "{Content-Type : image/svg+xml}"
        }
        else {
          console.log('filename:' + fileName + ' extn ' + extn);
          var contentType = "{Content-Type : text/css}"
        }
        res.writeHead(200, contentType);
        data.forEach(function (v) {
            res.write(v);
        });
        res.end();
    });
}

function FS_readFiles (path, cb) {
    var extn = pathO.extname(path);
    FS.readFile(path, function (err, data) {
        cb(extn, data);
    });
}




var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function(r){
  var connection = r.accept('echo-protocol', r.origin);
  var count = 0;
  var clients = {};
  // Specific id for this client & increment count
  var id = count++;
  // Store the connection method so we can loop through & contact all clients
  clients[id] = connection
  console.log((new Date()) + ' Connection accepted [' + id + ']');
  // Create event listener
  connection.on('message', function(message) {
    console.log(message);
    // The string message that was sent to us
    var msgString = message.utf8Data;
    // Loop through all clients
    for(var i in clients){
        // Send a message to the client with the message
        clients[i].sendUTF(msgString);
    }
  });
  connection.on('close', function(reasonCode, description) {
    delete clients[id];
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });

});




function MultiPart_parse(body, contentType) {
    // Examples for content types:
    //      multipart/form-data; boundary="----7dd322351017c"; ...
    //      multipart/form-data; boundary=----7dd322351017c; ...
    var m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

    if ( !m ) {
        throw new Error('Bad content-type header, no multipart boundary');
    }

    var boundary = m[1] || m[2];

    function Header_parse(header) {
        var headerFields = {};
        var matchResult = header.match(/^.*name="([^"]*)"$/);
        if ( matchResult ) headerFields.name = matchResult[1];
        return headerFields;
    }

    function rawStringToBuffer( str ) {
        var idx, len = str.length, arr = new Array( len );
        for ( idx = 0 ; idx < len ; ++idx ) {
            arr[ idx ] = str.charCodeAt(idx) & 0xFF;
        }
        return new Uint8Array( arr ).buffer;
    }

    // \r\n is part of the boundary.
    var boundary = '\r\n--' + boundary;

    var isRaw = typeof(body) !== 'string';

    if ( isRaw ) {
        // console.log('is raw');
        var view = new Uint8Array( body );
        s = String.fromCharCode.apply(null, view);
    } else {
        s = body;
    }

    // Prepend what has been stripped by the body parsing mechanism.
    s = '\r\n' + s;

    var parts = s.split(new RegExp(boundary)),
        partsByName = {};

    // First part is a preamble, last part is closing '--'
    for (var i=1; i<parts.length-1; i++) {
      var subparts = parts[i].split('\r\n\r\n');
      var headers = subparts[0].split('\r\n');
      for (var j=1; j<headers.length; j++) {
        var headerFields = Header_parse(headers[j]);
        if ( headerFields.name ) {
            fieldName = headerFields.name;
        }
      }

      partsByName[fieldName] = isRaw?rawStringToBuffer(subparts[1]):subparts[1];
    }

    return partsByName;
}


// // Retrieve
// var MongoClient = require('mongodb').MongoClient;
// var assert = require('assert');
// var ObjectId = require('mongodb').ObjectID;
// var url = 'mongodb://localhost:27017/test'
// // Connect to the db
// mPath = "mongodb://localhost:"+DB_PORT+"/restaurants"
// MongoClient.connect(mPath, function(err, db) {
//   if(!err) {
//     console.log("We are connected");
//   }
// });
//
//
// // Connect to the db
// MongoClient.connect(mPath, function(err, db) {
//   if(err) { return console.dir(err); }
//
//   db.collection('test', function(err, collection) {});
//
//   db.collection('test', {w:1}, function(err, collection) {});
//
//   db.createCollection('test', function(err, collection) {});
//
//   db.createCollection('test', {w:1}, function(err, collection) {});
//
// });
//
// // Connect to the db
// MongoClient.connect(mPath, function(err, db) {
//   if(err) { return console.dir(err); }
//
//   var collection = db.collection('test');
//   var doc1 = {'hello':'doc1'};
//   var doc2 = {'hello':'doc2'};
//   var lotsOfDocs = [{'hello':'doc3'}, {'hello':'doc4'}];
//
//   collection.insert(doc1);
//
//   collection.insert(doc2, {w:1}, function(err, result) {});
//
//   collection.insert(lotsOfDocs, {w:1}, function(err, result) {});
//
// });
//
// // Connect to the db
// MongoClient.connect(mPath, function(err, db) {
//   if(err) { return console.dir(err); }
//
//   var collection = db.collection('test');
//   var doc = {mykey:1, fieldtoupdate:1};
//
//   collection.insert(doc, {w:1}, function(err, result) {
//     collection.update({mykey:1}, {$set:{fieldtoupdate:2}}, {w:1}, function(err, result) {});
//   });
//
//   var doc2 = {mykey:2, docs:[{doc1:1}]};
//
//   collection.insert(doc2, {w:1}, function(err, result) {
//     collection.update({mykey:2}, {$push:{docs:{doc2:1}}}, {w:1}, function(err, result) {});
//   });
// });
//
//
// // Connect to the db
// MongoClient.connect(mPath, function(err, db) {
//   if(err) { return console.dir(err); }
//
//   var collection = db.collection('test');
//   var docs = [{mykey:1}, {mykey:2}, {mykey:3}];
//
//   collection.insert(docs, {w:1}, function(err, result) {
//
//     collection.remove({mykey:1});
//
//     collection.remove({mykey:2}, {w:1}, function(err, result) {});
//
//     collection.remove();
//   });
// });
//
//
//
// var insertDocument = function(db, callback) {
//    db.collection('restaurants').insertOne( {
//       "address" : {
//          "street" : "2 Avenue",
//          "zipcode" : "10075",
//          "building" : "1480",
//          "coord" : [ -73.9557413, 40.7720266 ]
//       },
//       "borough" : "Manhattan",
//       "cuisine" : "Italian",
//       "grades" : [
//          {
//             "date" : new Date("2014-10-01T00:00:00Z"),
//             "grade" : "A",
//             "score" : 11
//          },
//          {
//             "date" : new Date("2014-01-16T00:00:00Z"),
//             "grade" : "B",
//             "score" : 17
//          }
//       ],
//       "name" : "Vella",
//       "restaurant_id" : "41704620"
//    }, function(err, result) {
//     assert.equal(err, null);
//     console.log("Inserted a document into the restaurants collection.");
//     callback();
//   });
// };
//
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//   insertDocument(db, function() {
//       db.close();
//   });
// });



//   //  var cursor =db.collection('restaurants').find( { "address.zipcode": "10075" } );
//   //  var cursor =db.collection('restaurants').find( { "grades.grade": "B" } );
//   //  var cursor =db.collection('restaurants').find( { "grades.score": { $gt: 90 } } );
//   //  var cursor =db.collection('restaurants').find( { "grades.score": { $lt: 2 } } );
//   //  var cursor =db.collection('restaurants').find(
//   //     { "cuisine": "Italian", "address.zipcode": "10075" , "grades.grade": "B"}
//   //   );

  //  var cursor =db.collection('restaurants').find(
  //    { $or: [ { "cuisine": "Italian" }, { "address.zipcode": "10075" } ] }
  //  );
  //  var cursor =db.collection('restaurants').find().sort( { "borough": 1, "address.zipcode": 1 } );
// var findRestaurants = function(db, callback) {
//    var cursor =db.collection('restaurants').find( { "cuisine": "fart" } );
//    cursor.each(function(err, doc) {
//       assert.equal(err, null);
//       if (doc != null) {
//          console.dir(doc);
//       } else {
//          callback();
//       }
//    });
// };
//

// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//   findRestaurants(db, function() {
//       db.close();
//   });
// });
//

// var updateRestaurants = function(db, callback) {
//    db.collection('restaurants').updateOne(
//       { "name" : "Juni" },
//       {
//         $set: { "cuisine": "fart" },
//         $currentDate: { "lastModified": true }
//       }, function(err, results) {
//       console.log(results);
//       callback();
//    });
// };
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//
//   updateRestaurants(db, function() {
//       db.close();
//   });
// });
//



// var aggregateRestaurants = function(db, callback) {
//    db.collection('restaurants').aggregate(
//      [
//        { $group: { "_id": "$borough", "count": { $sum: 1 } } }
//      ]).toArray(function(err, result) {
//      assert.equal(err, null);
//      console.log(result);
//      callback(result);
//    });
// };
//
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//   aggregateRestaurants(db, function() {
//       db.close();
//   });
// });



// var indexRestaurants = function(db, callback) {
//    db.collection('restaurants').createIndex(
//       { "cuisine": 1 },
//       null,
//       function(err, results) {
//          console.log(results);
//          callback();
//       }
//    );
// };
//
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//   indexRestaurants(db, function() {
//       db.close();
//   });
// });
//



// var indexRestaurants = function(db, callback) {
//    db.collection('restaurants').createIndex(
//       { "cuisine": 1, "address.zipcode": -1 },
//       null,
//       function(err, results) {
//          console.log(results);
//          callback();
//       }
//    );
// };
//
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//   indexRestaurants(db, function() {
//       db.close();
//   });
// });
/**
 * Abstract helper to asyncly read a bulk of files
 * Note that `cb` will receive an array of errors for each file as an array of files data
 * Keys in resulting arrays will be the same as in `paths`
 *
 * @param {Array} paths - file paths array
 * @param {Function} cb
 *   @param {Array} errors - a list of file reading error
 *   @param {Array} data - a list of file content data
 */
