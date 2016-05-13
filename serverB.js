var http = require("http");
var pathO = require('path')
var fs = require('fs');
const SERVER_PORT = 8888;


var server = http.createServer( function(req, res) {
  console.log("created");
  if (req.method.toLowerCase() == 'get') {
    filePath = "sc1.js";

    fs.exists(filePath, function(exists) {
      if (exists) {
        x = new fs.createReadStream(filePath).pipe(res);
      }
      x.on('close', function(){x.unpipe()})
    });
    filePath = "index.html";
    fs.exists(filePath, function(exists) {
      if (exists) {
        y = new fs.createReadStream(filePath).pipe(res);
      }
      y.on('close', function(){y.unpipe()})
    });
      // sendIndex(req.url,res);
      console.log('giggidy');
  } else if (req.method.toLowerCase() == 'post') {
    console.log('got a Post');
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

var sendIndex = function(reqPath, res) {
  filePaths = ['sc1.js', 'main.css','index.html'];
  if (reqPath === '/')
    for (i = 0; i < 3;  i++) {
      filePath = filePaths[i]
      console.log(filePath);
      var extName = pathO.extname(filePath);
      console.log(extName);
      var contentType = ""
      switch (extName) {
        case '.html':
          contentType = "{'Content-Type': 'text/html'}";
          fs.exists(filePath, function(exists) {
            if (exists) {
              x = new fs.createReadStream(filePath).pipe(res);
            }
          x.on('close', function(){x.unpipe()})
          })
          break;
        case '.js':
          contentType = "{'Content-Type': 'text/javascript'}"
           fs.exists(filePath, function(exists) {
            if (exists) {
              y= new fs.createReadStream(filePath).pipe(res);
            }
          y.on('close', function(){y.unpipe()})
          })
          break
        case '.css':
          contentType = "{'Content-Type': 'text/html'}"
           fs.exists(filePath, function(exists) {
            if (exists) {
              z = new fs.createReadStream(filePath).pipe(res);
            }
          z.on('close', function(){z.unpipe()})
          })
          break
      }

      // fs.exists(filePath, function(exists) {
      //   if (exists) {
      //     fs.createReadStream(filePath).pipe(res);
      //     // fs.readFile(filePath, function(error, content)
      //     // {
      //       // if (error) {
      //       //   console.log("here, error with local file");
      //       //   res.writeHead(500);
      //       //   res.end();
      //       // }
      //       // else {
      //       //   res.writeHead(200, contentType);
      //       //   res.end(content);
      //       // }
      //       // });
      //   }
      // });
    }
};

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
        console.log('is raw');
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
