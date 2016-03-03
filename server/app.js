// Creates a new application instance

var fileInfo = require('./fileinfo');
var express = require('express');
var fs = require('fs');

var createCuratorApp = function (init) {
    init = init || {};

    // load in config settings
    var configString = fs.readFileSync("./resource/config.txt");
    var configData = JSON.parse(configString);
    init.fileInfo.dir = configData["imgSrcDir"];

    var instance = {
        fileInfo: fileInfo(init.fileInfo),
        expressInstance: express(),
    };

    // Initialize
    instance.fileInfo.initialize();
    instance.fileInfo.saveFileInfo(true);

    return instance;
}

module.exports = createCuratorApp;