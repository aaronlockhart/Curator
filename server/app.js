var fileInfo = require('./fileinfo');
var express = require('express');

var createCuratorApp = function (init) {
    init = init || {};
    var instance = {};

    instance.fileInfo = fileInfo(init.fileInfo);
    instance.fileInfo.initialize();
    instance.fileInfo.saveFileInfo(true);

    instance.expressInstance = express();

    return instance;
}

module.exports = createCuratorApp;