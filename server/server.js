var http = require('http');
var fs = require('fs');
var url = require('url');
var express = require('express');

var hostname = '192.168.0.102';
var port = 8080;

var rootPath = '../client';
var defaultDoc = '/index.html';

var contentTypes = {
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpg',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.js': 'text/javascript',
    '.css': "text/css",
}

var createfileMetaData = function (init) {
    init = init || {};
    var instance = {};
    instance.filename = init.filename || '';
    instance.path = init.path || '';
    instance.keep = init.keep || false;
    instance.tags = init.tags || [];
    instance.index = init.index || -1;

    return instance;
}

var createfileInfo = function (init) {
    init = init || {};
    var instance = {};

    instance.dir = init.dir || '';
    instance.currFile = init.currFile || undefined;
    instance.currFileIndex = init.currFileIndex || -1;
    instance.dirFiles = init.dirFiles || [];
    instance.fileMetaData = init.fileMetaData || {};
    instance.validFileTypes = init.validFileTypes || /\.*/i;
    
    // getNextFile(fileInfo)
    //
    // Gets the next file for the given fileInfo object
    // returns true if getNextFile can be called again, false otherwise (i.e. is at the end of the file set)
    instance.getNextFile = function () {
        if (instance.currFileIndex < instance.dirFiles.length - 1) {
            instance.currFileIndex += 1;
            instance.currFile = instance.dirFiles[instance.currFileIndex];
            return true;
        }

        return false;
    }

    // getPrevFile(fileInfo)
    //
    // Gets the previous file for the given fileInfo object
    // returns true if getPrevFile can be called again, false otherwise (i.e. is at the beginning of the file set)
    instance.getPrevFile = function () {
        if (instance.currFileIndex > 0) {
            instance.currFileIndex -= 1;
            instance.currFile = instance.dirFiles[instance.currFileIndex];
            return true;
        }

        return false;
    }
    
    // getFiles()
    // 
    // Retrieves a list of files and sets the next valid file
    instance.getFiles = function () {
        instance.dirFiles = fs.readdirSync(instance.dir);
    
        // build meta data
        while (instance.getNextFile()) {
            instance.fileMetaData[instance.currFile] = createfileMetaData({
                filename: instance.currFile,
                path: instance.dir,
                keep: false,
                index: instance.currFileIndex,
            })
        }
    
        // return to start
        while (instance.getPrevFile());

        if (!instance.isValidFile()) {
            getNextValidFile([instance.getNextFile, instance.getPrevFile], instance);
        }
    }

    // isValidFile(fileInfo)
    //
    // Determines if the next file is a valid file type
    instance.isValidFile = function (filename) {
        filename = (filename || instance.currFile) + "";
        console.log("testing " + filename + " is valid");
        return filename.match(instance.validFileTypes) && instance.fileMetaData[filename];
    }
    
    return instance;
}

var createCuratorApp = function (init) {
    init = init || {};
    var instance = {};

    instance.fileInfo = createfileInfo(init.fileInfo);
    instance.expressInstance = express();

    return instance;
}

// getQueryValueString(query, strNewline)
//
// Gets the values of the query string object as a single string
function getQueryValueString(query, strNewline) {
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
function getContentType(path) {
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
function serveFile(res, path) {
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
                var contentType = getContentType(path);
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
function serveJavascriptObject(res, obj, callback) {
    if (callback) {
        res.writeHead(200, { 'Content-type': 'application/javascript' });
        res.end(callback + '(' + JSON.stringify(obj) + ');');
    }
    else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
    }
}

// getNextValidFile(funcArr, fileInfo, currMethod)
//
// Uses an array of functions to try and find the next valid file
//
// funcArr : an array of functions with signature (fileInfo) => bool 
// each function in the array will be called until either the function returns false
// or the function sets a valid file for fileInfo.
// 
// fileInfo : the fileInfo object
//
// currFunc : the index into funcArr which indicates the function being called
function getNextValidFile(funcArr, fileInfo, currFunc) {
    currFunc = currFunc || 0;

    if (currFunc < funcArr.length) {
        // use the current method until it returns false or a valid file
        // type is returned
        do {
            var res = funcArr[currFunc](fileInfo);
        }
        while (res && !fileInfo.isValidFile());

        if (!fileInfo.isValidFile()) {
            // call the next function to try and find a file
            getNextValidFile(funcArr, fileInfo, ++currFunc);
        }
    }
}

// App initialization and server startup.
var appInstance = createCuratorApp({
    fileInfo: {
        dir: 'D:\\OneDrive\\Photos\\2011\\2012-01-04',
        validFileTypes: /\.gif|\.jpg|\.jpeg/i,
    }
});

appInstance.fileInfo.getFiles();

console.log(appInstance.fileInfo);

// Server routing
appInstance.expressInstance.use('/', express.static(rootPath));

appInstance.expressInstance.get('/file', function (req, res) {
    var reqURL = url.parse(req.url, true);
    console.log("Received query: " + req.url + '\n');
    console.log(getQueryValueString(reqURL.query));

    var filename = reqURL.query.filename || appInstance.fileInfo.currFile;
            
    // Serve the current image
    if (!appInstance.fileInfo.isValidFile(filename)) {
        res.end();
    }
    else {
        serveFile(res, appInstance.fileInfo.dir + '\\' + filename);
    }
});

appInstance.expressInstance.get('/currentFileInfo', function (req, res) {
    var reqURL = url.parse(req.url, true);
    console.log("Received query: " + req.url + '\n');
    console.log(getQueryValueString(reqURL.query));

    serveJavascriptObject(res, appInstance.fileInfo.fileMetaData[appInstance.fileInfo.currFile]);
});

appInstance.expressInstance.get('/action', function (req, res) {
    var reqURL = url.parse(req.url, true);
    console.log("Received query: " + req.url + '\n');
    console.log(getQueryValueString(reqURL.query));

    // Button actions
    if (reqURL.query.button === 'prev') {
        getNextValidFile([appInstance.fileInfo.getPrevFile, appInstance.fileInfo.getNextFile], appInstance.fileInfo);
        if (reqURL.query.ajax === 'true') {
            serveJavascriptObject(res, appInstance.fileInfo.fileMetaData[appInstance.fileInfo.currFile]);
            return;
        }
    }
    else if (reqURL.query.button === 'next') {
        getNextValidFile([appInstance.fileInfo.getNextFile, appInstance.fileInfo.getPrevFile], appInstance.fileInfo);
        if (reqURL.query.ajax === 'true') {
            serveJavascriptObject(res, appInstance.fileInfo.fileMetaData[appInstance.fileInfo.currFile]);
            return;
        }
    }
    else if (reqURL.query.button === 'keep') {
        var filename = reqURL.query.filename;
        appInstance.fileInfo.fileMetaData[filename].keep = true;
        if (reqURL.query.ajax === 'true') {
            serveJavascriptObject(res, appInstance.fileInfo.fileMetaData[filename]);
            return;
        }
    }
    else if (reqURL.query.button === 'unkeep') {
        var filename = reqURL.query.filename;
        appInstance.fileInfo.fileMetaData[filename].keep = false;
        if (reqURL.query.ajax === 'true') {
            serveJavascriptObject(res, appInstance.fileInfo.fileMetaData[filename]);
            return;
        }
    }
});

// Server start
appInstance.expressInstance.listen(8080, function () {
    console.log('Server running at ' + hostname + ' on port ' + port);
})