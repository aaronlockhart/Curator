var fs = require('fs');

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
    var backupDir = configData["backupDir"] || './data';
    
    var instance = {
        // fileInfo manages the metadata for all the files in the file set
        fileInfo: fileInfo(init.fileInfo),
        
        // An instance of express used for routing server requests
        expressInstance: express(),
        
        // Moves the files marked for backup to the one drive folder
        moveFilesToBackupFolder: function () {
            var keepFiles = this.fileInfo.getFilteredMetadata(function (data) { return data.keep == true; });
            for (var i = 0; i < keepFiles.length; i++) {
                var currentFilePath = keepFiles[i].getPath();
                var backupFilePath = backupDir + keepFiles[i].getPartialPath();
                var metadata = keepFiles[i];

                console.log('Copying ' + currentFilePath + ' to ' + backupFilePath);

                var readStream = fs.createReadStream(currentFilePath);
                
                readStream.on('error', function (err) {
                    console.log("Error on readstream: " + err);
                });

                var writeStream = fs.createWriteStream(backupFilePath);
                
                writeStream.on('error', function (err) {
                    console.log("Error on writestream: " + err);
                });

                writeStream.on('end', function () {
                    console.log("Finished copying " + metadata.filename);
                    this.fileInfo.deleteFileMetadata();
                });

                // do the copy
                readStream.on('open', function (fd) {
                    writeStream.on('open', function (fd) {
                        readStream.pipe(writeStream);
                    })
                });
            }
        },
    };

    // Initialize
    instance.fileInfo.initialize();
    instance.fileInfo.saveFileInfo(true);

    return instance;
}

module.exports = createCuratorApp;