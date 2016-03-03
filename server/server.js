var http = require('http');
var fs = require('fs');
var url = require('url');
var express = require('express');
var app = require('./app');
var util = require('./util');

// app configuration data
var rootPath = '../client';
var fileInfoFilename = './data/fileInfo.txt';
var validFileTypes = /\.gif|\.jpg|\.jpeg/i;
var serverPort = 8080;
var backupDir = ['D:\\OneDrive\\Photos'];

RegExp.prototype.toJSON = RegExp.prototype.toString;

// App initialization and server startup.
var appInstance = app({
    backupDir: backupDir,
    fileInfo: {
        validFileTypes: validFileTypes,
        fileInfoFilename: fileInfoFilename,
    }
});

// Server routing
appInstance.expressInstance.use('/', express.static(rootPath));

// Handle client requests for a given file
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

// Handle client requests to get file information for the current file
appInstance.expressInstance.get('/currentFileInfo', function (req, res) {
    var reqURL = url.parse(req.url, true);
    console.log("Received query: " + req.url + '\n');
    console.log(util.getQueryValueString(reqURL.query));

    util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata());
});


// Actions (client requests to do something..)
appInstance.expressInstance.get('/action', function (req, res, next) {
    var reqURL = url.parse(req.url, true);
    console.log("Received query: " + req.url + '\n');
    console.log(util.getQueryValueString(reqURL.query));

    // get the previous file from the set
    if (reqURL.query.button === 'prev') {
        appInstance.fileInfo.getPrevValidFile();
        if (reqURL.query.ajax === 'true') {
            util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata());
            return;
        }
    }
    // get the next file from the set
    else if (reqURL.query.button === 'next') {
        appInstance.fileInfo.getNextValidFile();
        if (reqURL.query.ajax === 'true') {
            util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata());
            return;
        }
    }
    // mark a file for backup
    else if (reqURL.query.button === 'keep') {
        var filename = reqURL.query.filename;
        appInstance.fileInfo.updateFileMetadata(filename, { keep: true });
        if (reqURL.query.ajax === 'true') {
            util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata(filename));
            return;
        }
    }
    // unmark the file for backup
    else if (reqURL.query.button === 'unkeep') {
        var filename = reqURL.query.filename;
        appInstance.fileInfo.updateFileMetadata(filename, { keep: false });
        if (reqURL.query.ajax === 'true') {
            util.serveJavascriptObject(res, appInstance.fileInfo.getFileMetadata(filename));
            return;
        }
    }
    else if (reqURL.query.button === 'move') {
        appInstance.moveFilesToBackupFolder();
        if (reqURL.query.ajax === 'true') {
            return;
        }
    }

    // This will redirect back to the root path so that the form buttons will work
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