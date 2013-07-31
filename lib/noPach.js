#! /usr/bin/env node

/*
 * noPach
 * git://github.com/mitchelldemarco/Projects
 *
 * Copyright (c) 2013 Mitchell
 * Licensed under the MIT license.
 */

var http = require('http');
var https = require('https');
var url = require('url');
var path = require('path');
var fs = require('fs');
var portfinder = require('portfinder');
var dirs_in = [];
var files_in = [];
var projectDir = process.argv.splice(2);

var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "swf": "application/x-shockwave-flash",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css"
};

var options = {
  key: fs.readFileSync('privatekey.pem').toString(),
  cert: fs.readFileSync('certificate.pem').toString()
};


portfinder.getPort(function (err, port) {
  console.log("HTTPS Server created on port: " + port + " based in " + projectDir[0])
  https.createServer(options, server).listen(port);
});
/*
portfinder.getPort(function (err, port) {
  console.log("HTTP Server created on port: " + port + " based in " + projectDir[0])
  http.createServer(server).listen(port);
});
*/

function server(req, res) {
  var uri = url.parse(req.url).pathname;
  serveFile(uri, res);
}

function printDirectory(uri, res){
  var filename = path.join(process.cwd(), projectDir[0], uri);
  fs.readdir(filename + "/", function(err, files){
    if (err) {
      throw err;
    }

    dirs_in = [];
    files_in = [];
    
    res.writeHead(200, {'Content-Type': mimeTypes['html']});
    res.write("<HTML><HEAD><title>Directory Listing</title></HEAD><BODY><h1>Directory Listing for " + filename + "</h1>");
    res.write("<ul>");
    for( var x = 0; x < files.length; x++ ){
      res.write("<li><a href='" + uri + "/" + files[x] + "'>" + files[x] + "</a>" );
      if( fs.statSync( path.join(filename + "/" + files[x]) ).isDirectory() ){
        res.write(" is a <b style='color:blue'>dir</b>");
      } else {
       res.write(" is a <b style='color:green'>file</b>");
      }
      res.write("</li>");
    }
    res.write("</ul>");
    res.write("</BODY></HTML>");
    res.end();
  });
}


function serveFile(uri, res) {
  var stats;
  var filename = path.join(process.cwd(), projectDir[0], uri);

  try {
    stats = fs.lstatSync(filename); // throws if path doesn't exist
  } catch (e) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('404 Not Found\n');
    res.end();
    //console.log("404", filename);
    return;
  }

  if (stats.isFile()) {
    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    res.writeHead(200, {'Content-Type': mimeType});
    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
    //console.log("200", filename);
  } else if (stats.isDirectory()) {
    fs.exists(path.join(filename, "index.html"), function (exists) {
      if( exists ){
        serveFile(path.join(uri, "index.html"), res);
      }else{
        printDirectory(uri, res);
      }
    });

  } else {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.write('500 Internal server error\n');
    res.end();
    //console.log("500", filename);
  }
}
