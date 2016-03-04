// Creates a new application instance
var fileInfo = require('./fileinfo');
var express = require('express');
var fs = require('fs');
var util = require('./util');

var createCuratorApp = function (init) {
    init = init || {};

    // load in config settings
    var configString = fs.readFileSync("./resource/config.txt");
    var configData = JSON.parse(configString);

    init.fileInfo.dir = configData["imgSrcDir"];
    var backupDir = configData["backupDir"] || './data';

    var instance = {
        // fileInfo manages the metadata for all the files in the file set
        fileInfo: fileInfo(init.fileInfo),

        // An instance of express used for routing server requests.
        expressInstance: express(),

        // Moves the files marked for backup to the backup folder.
        moveFilesToBackupFolder: function (files) {
            var keepFiles = files || this.fileInfo.getFilteredMetadata(function (data) { return data.keep == true; });

            for (var i = 0; i < keepFiles.length; i++) {
                var currentFilePath = keepFiles[i].getPath();
                var backupFilePath = backupDir + keepFiles[i].getPartialPath();

                (function (source, dest, meta, app) {
                    util.copyFile(source, dest, function () {
                        console.log("Done copying file " + dest);
                        meta.backedUp = true;
                        meta.backupPath = dest;
                        app.fileInfo.updateFileMetadata(meta.filename, meta);
                    });
                })(currentFilePath, backupFilePath, keepFiles[i], this);
            }
        },

        moveToBackupFolder: function (filename) {
            if (filename) {
                this.moveFilesToBackupFolder([this.fileInfo.getFileMetadata(filename)]);
            }
        },
    };

    // Initialize
    instance.fileInfo.initialize();
    instance.fileInfo.saveFileInfo(true);

    return instance;
}

module.exports = createCuratorApp;