// Creates a new application instance

var fileInfo = require('./fileinfo');
var express = require('express');

var createCuratorApp = function (init) {
    init = init || {};
    
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