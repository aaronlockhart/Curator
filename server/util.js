var fs = require('fs');
var pathModule = require('path');
var mkdirpModule = require('mkdirp');

var contentTypes = {
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpg',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.js': 'text/javascript',
    '.css': "text/css",
}

// Helper functions ///////////////////////////////////////////
 
// getQueryValueString(query, strNewline)
//
// Gets the values of the query string object as a single string
module.exports.getQueryValueString = function (query, strNewline) {
    strNewline = strNewline || '\n';
    var queryVals = '';
    for (var prop in query) {
        queryVals += prop + ':' + query[prop] + strNewline;
    }
    return queryVals;
}

// getContentType(path)
//
// Retrieves the content type using the extension of the file
// passed in the path parameter
module.exports.getContentType = function (path) {
    path = path || '';
    var i = path.lastIndexOf('.');
    if (i > -1) {
        return contentTypes[path.substr(i)];
    }
}

// serveFile(res, path, contentType)
//
// Serves a file to the response stream
// res : the http.ServerResponse object
// path : the path of the file to serve
module.exports.serveFile = function (res, path) {
    if (res && path) {
        fs.readFile(path, function (err, data) {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.log(path + ' not found returning 404 response');
                    res.writeHead(404);
                    res.end();
                    return;
                }
                else {
                    throw err;
                }
            }
            else {
                console.log('Now serving ' + path);
                var contentType = module.exports.getContentType(path);
                if (contentType) {
                    res.writeHead(200, { 'Content-Type': contentType });
                }

                res.end(data);
                return;
            }
        });
    }
}

// serveJavascriptObject(res, obj, callback)
//
// Serves a javascript object as the response.  Can optionally use jsonp to return the object by supplying a callback
// method name.
// res : the http.ServerResponse object
// obj : the javascript object to return in the response as a JSON string
// callback : an optional string containing the name of a callback function to wrap around the JSON object string
module.exports.serveJavascriptObject = function (res, obj, callback) {
    if (callback) {
        res.writeHead(200, { 'Content-type': 'application/javascript' });
        res.end(callback + '(' + JSON.stringify(obj) + ');');
    }
    else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
    }
}

// copyFile(srcFilePath, dstFilePath)
//
// Copy a file from the srcFilePath to dstFilePath asynchronously
module.exports.copyFile = function (srcFilePath, dstFilePath, onComplete) {
    console.log('Copying ' + srcFilePath + ' to ' + dstFilePath);

    var readStream = fs.createReadStream(srcFilePath);

    readStream.on('error', function (err) {
        console.log("Error on readstream: " + err);
    });

    // do the copy
    readStream.on('open', function (fd) {
        var dstDir = dstFilePath.substring(0, dstFilePath.lastIndexOf(pathModule.sep));
        mkdirpModule(dstDir, function (err) {
            if (err) {
                console.log("Failed to mkdirp " + dstDir + " Error:" + err);
            }
            else {
                var writeStream = fs.createWriteStream(dstFilePath);

                writeStream.on('error', function (err) {
                    console.log("Error on writestream: " + err);
                });

                writeStream.on('finish', onComplete);

                writeStream.on('open', function (fd) {
                    readStream.pipe(writeStream);
                })
            }
        });
    });
}

module.exports.deleteFile = function (deleteFilePath, onComplete) {
    console.log("Attempting to delete file " + deleteFilePath);
    fs.unlink(deleteFilePath, onComplete);
}

module.exports.getDirsSync = function (path, recurse) {
    var dirInfo = fs.readdirSync(path);
    var result = [];

    dirInfo.map(function (file) {
        return pathModule.join(path, file);
    }).filter(function (file) {
        return !fs.statSync(file).isFile();
    }).forEach(function (file) {
        result.push(file);
    })

    if (recurse) {
        var subdirs = [];
        result.forEach(function (path) {
            subdirs.concat(module.exports.getDirsSync(path));
        })
        result.concat(subdirs);
    }

    return result;
}

module.exports.getFilesInDirSync = function (path) {
    var dirInfo = fs.readdirSync(path);
    var result = [];

    dirInfo.map(function (file) {
        return pathModule.join(path, file);
    }).filter(function (file) {
        return fs.statSync(file).isFile();
    }).forEach(function (file) {
        result.push(file);
    })
    
    return result;
}