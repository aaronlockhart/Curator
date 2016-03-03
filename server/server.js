var http = require('http');
var fs = require('fs');
var url = require('url');
var express = require('express');
var app = require('./app');
var util = require('./util');

// app configuration data
var rootPath = '../client';
var fileInfoFilename = './data/fileInfo.txt';
var imageSrcDir = 'C:\\Users\\Public\\Pictures\\Sample Pictures';
var validFileTypes = /\.gif|\.jpg|\.jpeg/i;
var serverPort = 8080;

RegExp.prototype.toJSON = RegExp.prototype.toString;

// App initialization and server startup.
var appInstance = app({
    fileInfo: {
        dir: imageSrcDir,
        validFileTypes: validFileTypes,
        fileInfoFilename: fileInfoFilename,
    }
});

// Server routing
appInstance.expressInstance.use('/', express.static(rootPath));

appInstance.expressInstance.get('/file', function (req, res) {
    var reqURL = url.parse(req.url, true);
    console.log("Received query: " + req.url + '\n');
    console.log(util.getQueryValueString(reqURL.query));

    var filename = reqURL.query.filename;
            
    // Serve the current image
    if (!appInstance.fileInfo.isValidFile(filename)) {
        res.end();
    }
    else {
        util.serveFile(res, appInstance.fileInfo.getFilePath(filename));
    }
});

appInstance.expressInstance.get('/currentFileInfo', function (req, res) {
    var reqURL = url.parse(req.url, true);
    console.log("Received query: " + req.url + '\n');
    console.log(util.getQueryValueString(reqURL.query));

    util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata());
});

appInstance.expressInstance.get('/action', function (req, res, next) {
    var reqURL = url.parse(req.url, true);
    console.log("Received query: " + req.url + '\n');
    console.log(util.getQueryValueString(reqURL.query));

    // Button actions
    if (reqURL.query.button === 'prev') {
        appInstance.fileInfo.getPrevValidFile();
        if (reqURL.query.ajax === 'true') {
            util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata());
            return;
        }
    }
    else if (reqURL.query.button === 'next') {
        appInstance.fileInfo.getNextValidFile();
        if (reqURL.query.ajax === 'true') {
            util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata());
            return;
        }
    }
    else if (reqURL.query.button === 'keep') {
        var filename = reqURL.query.filename;
        appInstance.fileInfo.updateFileMetadata(filename, { keep: true });
        if (reqURL.query.ajax === 'true') {
            util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata(filename));
            return;
        }
    }
    else if (reqURL.query.button === 'unkeep') {
        var filename = reqURL.query.filename;
        appInstance.fileInfo.updateFileMetadata(filename, { keep: false });
        if (reqURL.query.ajax === 'true') {
            util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata(filename));
            return;
        }
    }

    res.redirect('/');
});

// Server start
appInstance.expressInstance.listen(8080, function () {
    console.log('Server running on port ' + serverPort);
})

// Server shutdown hooks
process.on('SIGINT', function () {
    console.log('Caught SIGINT');
    process.exit();
});

process.on('exit', function () {
    console.log("Exiting..");
    appInstance.fileInfo.saveFileInfo(true);
});