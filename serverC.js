var http = require("http");
var pathO = require('path');
var FS = require('fs');
const SERVER_PORT = 8888;
const DB_PORT = "27017";
var sessions={};
var userID = "";
var ObjectId = require('mongodb').ObjectID;
var allFiles = [
   'index.html'
];

var server = http.createServer( function(req, res) {
  if (req.method.toLowerCase() == 'get') {
      // lookupOrCreate(req,{});
      // console.log(JSON.stringify(sessions));
      // console.log(req.headers.cookie);
      // if(req.cookies === undefined) {
      //   userID = "__NO__USER__";
      // }

      if(req.url=='/index.html' || req.url=='/') {
        sendFiles(res, "index.html");
      }
      if(req.url=='/sc1.js') {
        sendFiles(res,"sc1.js");
      }
      if(req.url=='/jquery.js') {
        sendFiles(res,"jquery.js");
      }

      if(req.url=='/jquery.countdown.js') {
        sendFiles(res,"jquery.countdown.js");
      }
      if(req.url=='/main.css') {
        sendFiles(res,"main.css");
      }
      if(req.url=='/jquery-ui.css') {
        sendFiles(res,"jquery-ui.css");
      }
      if(req.url=='/favicon.ico') {
        sendFiles(res,"favicon.ico");
      }
      if(req.url=='/mesh.jpg') {
        sendFiles(res,"mesh.jpg");
      }
      if(req.url=='/images/ui-bg_gloss-wave_35_f6a828_500x100.png') {
        sendFiles(res,"/images/ui-bg_gloss-wave_35_f6a828_500x100.png");
      }
      if(req.url=='/images/ui-bg_highlight-soft_100_eeeeee_1x100.png') {
        sendFiles(res,"/images/ui-bg_highlight-soft_100_eeeeee_1x100.png");
      }




  } else if (req.method.toLowerCase() == 'post') {
      // console.log('got a Post');
      if(req.url=='/login') {
        req.on('data', function(stuff) {
          var x = MultiPart_parse(stuff.toString(), req.headers['content-type']);
          checkUserValid(x.email,x.passWord,res,req);
        });
      }
      else if(req.url=='/newEvent') {
        // console.log('sess obj');
        // console.log(sessions);
        // console.log(idTest(req,{}));
        if (idTest(req,{}) != null) {
          req.on('data', function(stuff) {
            var x = MultiPart_parse(stuff.toString(), req.headers['content-type']);
            console.log('x  obj  ');            console.log(x);
            // var tempDate = x['eventTime'];
            x['likes'] = 0;
            postEvent(x);
          });
        }
        else {
          console.log("user not logged in");
        }
      }
  }
});
server.listen(SERVER_PORT);



function sendFiles(res, fileName) {
    FS_readFiles(fileName, function (data, extn) {

        if (extn === '.js') {
          var contentType = "{Content-Type : application/javascript}"
        }
        else if (extn === '.svg') {
          var contentType = "{Content-Type : image/svg+xml}"
        }
        else if (extn === '.ico') {
          var contentType = "{Content-Type : image/x-icon}"
        }
        else {
          var contentType = "{Content-Type : text/css}"
        }

        res.writeHead(200, contentType);
        // response.writeHead(200, {
        //   'Content-Type': 'text/plain',
        //   'Set-Cookie', session.getSetCookieHeaderValue()
        // });
        data.forEach(function (v) {
            res.write(v);
        });
        res.end();
    });
}

function FS_readFiles (path, cb) {
    var result = [], errors = [], l = path.length, extn;
    var k = 0;
    // paths.forEach(function (path, k) {
        // console.log("FS_readFiles");
        // console.log(path);
        FS.readFile(path, function (err, data) {
            extn = pathO.extname(path);
            // console.log("EXTN");
            // console.log(extn);
            // decrease waiting files
            --l;
            // just skip non-npm packages and decrease valid files count
            err && (errors[k] = err);
            !err && (result[k] = data);
            // invoke cb if all read
            // console.log("result: ===");
            // console.log(result);
            cb (  result, extn);
        });

    // });
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
  // connection.on('message', function(message) {
  //   console.log(message);
  //   // The string message that was sent to us
  //   var msgString = message.utf8Data;
  //   // Loop through all clients
  //   for(var i in clients){
  //       // Send a message to the client with the message
  //       clients[i].sendUTF(msgString);
  //   }
  // });
  connection.on('message', function(message) {
    // The string message that was sent to us
    console.log("HHHHHHE");

    var msgString = message.utf8Data;
    if (msgString.indexOf("__GET__USER__DATA__") >= 0) {
      var userName = msgString.slice("__GET__USER__DATA__".length);
      //get data for user and pass back to client
      if (userID === "__NO__USER__") {
        getMostPopular(connection)
      }
      else {
        getUserEvents(userName, connection)
      }
      // , function(answer) {
      //   cn.sendUTF("hey hey" + answer[0].title)});
      // connection.sendUTF(x[0]);
    }
    else if (msgString.indexOf("__LIKE__") >= 0) {
      var idLike = msgString.slice("__LIKE__".length);
      console.log(idLike);
      increaseLike(idLike);
    }
    else {
      // Loop through all clients
      for(var i in clients){
          console.log("got here???");
          // Send a message to the client with the message
          clients[i].sendUTF(msgString);
      }
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



// Retrieve
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
// var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:'+DB_PORT+'/event'
// // Connect to the db
// mPath = "mongodb://localhost:"+DB_PORT+"/events"
// MongoClient.connect(mPath, function(err, db) {
//   if(!err) {
//     console.log("We are connected");
//   }
// });
//
//


var postEvent = function(eventData) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    db.collection('events').insertOne(eventData);
    db.close();
  });
}


var findEvents = function(db, callback) {
   var cursor = db.collection('events').find();
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
        //  console.dir(doc);
      } else {
         callback();
      }
   });
};

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  findEvents(db, function() {
      db.close();
  });
});


var getUserEvents2 = function(userName, db, callback) {
  var strName = '"' + userName +'"';
  var cursor = db.collection('events').find( { user : userName} );
  // var cursor = db.collection('events').find();

  var results ={0 : "_USER__DATA__"};
  var i = 0;
  cursor.each(function(err, result) {
    assert.equal(err, null);
    if (result != null) {
      i++;
      results[i]=result;
    } else {
       callback(results);
    }
  });
};

var getUserEvents = function(userName, cn) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    getUserEvents2(userName, db, function(results) {
        db.close();
        cn.sendUTF(JSON.stringify(results));
        // cb(results, cn);
    });
  });
}





var getMostPopular2 = function(db, callback) {
  var cursor = db.collection('events').find( { likes : { $gt: 5 } }).sort({likes : -1});
  // var cursor = db.collection('events').find();

  var results ={0 : "_USER__DATA__"};
  var i = 0;
  cursor.each(function(err, result) {
    assert.equal(err, null);
    if (result != null) {
      console.log(result);
      i++;
      results[i]=result;
    } else {
       callback(results);
    }
  });
};

var getMostPopular = function(cn) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    getMostPopular2(db, function(results) {
        db.close();
        cn.sendUTF(JSON.stringify(results));
        // cb(results, cn);
    });
  });
}



var increaseLike2 = function(id, db, callback) {
  console.log("OBJECT ID");
  console.log(id);
  var oId = new ObjectId(id);
   db.collection('events').update(
        { _id:oId},
        {
          $inc: {likes:1}
        }, function(err, results) {
          callback();
        });
};
var increaseLike = function(idLike) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    increaseLike2(idLike, db, function() {
        db.close();
    });
  });
};


var checkUserValid2 = function(loginEmail, passwd, httpRes, httpReq, db, callback) {
  var cursor = db.collection('users').find({$and: [{ email: loginEmail }, { password: passwd}]});
  var i = 0;
  cursor.each(function(err, result) {
    assert.equal(err, null);
    if (result != null) {
      var sess = {};
      var sess = lookupOrCreate(httpReq,{});
      var ck = sess.getSetCookieHeaderValue();
      httpRes.setHeader('Set-Cookie', ck);
      httpRes.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      httpRes.end();
      var sess = {};
      i++;
    } else {
      callback();
    }
  });
};

var checkUserValid = function(loginEmail, passwd, httpRes, httpReq) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    checkUserValid2(loginEmail, passwd, httpRes, httpReq, db, function() {
        db.close();
    });
  });
}

// var updateEvents = function(db, callback) {
//    db.collection('events').updateOne(
//       { "title" : "Game o thrones" },
//       {
//         $set: { "likes": 8 }
//       }, function(err, results) {
//       callback();
//    });
// };
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//
//   updateEvents(db, function() {
//       db.close();
//   });
// });

//   //  var cursor =db.collection('restaurants').find( { "grades.grade": "B" } );
//   //  var cursor =db.collection('restaurants').find( { "grades.score": { $gt: 90 } } );
//   //  var cursor =db.collection('restaurants').find( { "grades.score": { $lt: 2 } } );
//   //  var cursor =db.collection('restaurants').find(
//   //     { "cuisine": "Italian", "address.zipcode": "10075" , "grades.grade": "B"}
//   //   );

  //  var cursor =db.collection('restaurants').find(
  //    { $or: [ { "cuisine": "Italian" }, { "address.zipcode": "10075" } ] }
  //  );
// var cursor =db.collection('restaurants').find().sort( { "borough": 1, "address.zipcode": 1 } );


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
//    db.collection('events').insertOne( {
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
//     console.log("Inserted a document into the events collection.");
//     callback();
//   });
// };





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




var timeout;

exports.lookupOrCreate=lookupOrCreate

// this should not normally be used, but it's there if you want to access the session store from a debugger
exports.sessionRoot=sessions

function ownProp(o,p){
  return Object.prototype.hasOwnProperty.call(o,p)
}

function lookupOrCreate(req,opts){
  var id,session;
  opts=opts||{};
  // find or generate a session ID
  id=idFromRequest(req,opts);

  // if the session exists, use it
  if(ownProp(sessions,id)){
    session=sessions[id];
    console.log('if the session exists, use it....sessions[id]');
    console.log(sessions[id]);
  }
  // otherwise create a new session object with that ID, and store it
  else{
    session=new Session(id,opts);
    sessions[id]=session;
    console.log(' new sessions[id]');
    console.log('id= ' +id);
    console.log(sessions[id]);
  }

  // set the time at which the session can be reclaimed
  session.expiration=(+new Date)+session.lifetime*1000
  // make sure a timeout is pending for the expired session reaper
  if(!timeout) {
    timeout=setTimeout(cleanup,60000);
  }

  return session;
  // return id;
}


function cleanup(){
  var id,now,next
  now = +new Date
  next=Infinity
  timeout=null
  for(id in sessions)
    if(ownProp(sessions,id)){
      if(sessions[id].expiration < now){
        delete sessions[id]
      }
    else next = next<sessions[id].expiration ? next : sessions[id].expiration
    }
  if(next<Infinity)
    timeout=setTimeout(cleanup,next - (+new Date) + 1000)
}


function idTest(req,opts){
  var m
  // look for an existing SID in the Cookie header for which we have a session
  if(req.headers.cookie
      && (m = /SID=([^ ,;]*)/.exec(req.headers.cookie))
      && ownProp(sessions,m[1]))
  {
    console.log("m[1]");
    console.log(m[1]);
    return m[1];
  }
  return null;
}
function idFromRequest(req,opts){
  var m
  // look for an existing SID in the Cookie header for which we have a session
  if(req.headers.cookie
      && (m = /SID=([^ ,;]*)/.exec(req.headers.cookie))
      && ownProp(sessions,m[1]))
  {
    console.log("m[1]");
    console.log(m[1]);
    return m[1];
  }
  // otherwise we need to create one
  // if an ID is provided by the caller in the options, we use that
  if(opts.sessionID) return opts.sessionID
  // otherwise a 64 bit random string is used
  return randomString(64)
}



function Session(id,opts){
  this.id=id
  this.data={}
  this.path=opts.path||'/'
  this.domain=opts.domain
  // if the caller provides an explicit lifetime, then we use a persistent cookie
  // it will expire on both the client and the server lifetime seconds after the last use
  // otherwise, the cookie will exist on the browser until the user closes the window or tab,
  // and on the server for 24 hours after the last use
  if(opts.lifetime){
    this.persistent = 'persistent' in opts ? opts.persistent : true
    this.lifetime=opts.lifetime}
  else{
    this.persistent=false
    this.lifetime=86400}
}



// randomString returns a pseude-random ASCII string which contains at least the specified number of bits of entropy
// the return value is a string of length ⌈bits/6⌉ of characters from the base64 alphabet
function randomString(bits){var chars,rand,i,ret
  chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  ret=''
  // in v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53)
  while(bits > 0){
    rand=Math.floor(Math.random()*0x100000000) // 32-bit integer
    // base 64 means 6 bits per character, so we use the top 30 bits from rand to give 30/6=5 characters.
    for(i=26; i>0 && bits>0; i-=6, bits-=6) ret+=chars[0x3F & rand >>> i]}
  return ret
}


Session.prototype.getSetCookieHeaderValue=function(){
  var parts
  parts=['SID='+this.id]
  if(this.path) parts.push('path='+this.path)
  if(this.domain) parts.push('domain='+this.domain)
  if(this.persistent) parts.push('expires='+dateCookieString(this.expiration))
  return parts.join('; ')
}



// from milliseconds since the epoch to Cookie 'expires' format which is Wdy, DD-Mon-YYYY HH:MM:SS GMT
function dateCookieString(ms){
  var d,wdy,mon
  d=new Date(ms)
  wdy=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  mon=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return wdy[d.getUTCDay()]+', '+pad(d.getUTCDate())+'-'+mon[d.getUTCMonth()]+'-'+d.getUTCFullYear()
    +' '+pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())+':'+pad(d.getUTCSeconds())+' GMT'
}

function pad(n){
  return n>9 ? ''+n : '0'+n;
}

Session.prototype.destroy=function(){
  delete sessions[this.id];
}
