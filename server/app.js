// Creates a new application instance
var fileInfo = require('./fileinfo');
var express = require('express');
var fs = require('fs');
var util = require('./util');

var createCuratorApp = function (init) {
    init = init || {};
    
    // Private data ////
    var fileInfosDir = "";
    
    // fileInfos is an array of all the file info objects (one for every folder)
    var fileInfos = [];
    
    // Configuration settings
    var configData = {};
    
    // The paths to where images can be located
    var imageSrcDirs = [];
    
    // The backup folder path
    var backupDir = ""
    
    // Private methods ////
    var setInitConfigOnFileInfo = function (info) {
        // copy in app initialization information
        if (init.fileInfo) {
            for (var key in init.fileInfo) {
                if (init.fileInfo.hasOwnProperty(key)) {
                    info[key] = init.fileInfo[key];
                }
            }
        }
        
        return info;
    }

    var loadFileInfosSync = function () {
        var fileInfoFiles = util.getFilesInDirSync(fileInfosDir);

        // load any existing fileInfos
        fileInfoFiles.forEach(function (file) {
            var fileInfoDataString = fs.readFileSync(file);

            console.log("Loading existing file info " + file);
            var fileInfoDataObject = JSON.parse(fileInfoDataString)
            setInitConfigOnFileInfo(fileInfoDataObject);

            fileInfos.push(fileInfo(fileInfoDataObject));
        });
        
        // Bootstrap any source dirs that don't exist
        imageSrcDirs.forEach(function (srcDir) {
            console.log("Bootstrapping " + srcDir);
            
            var match = fileInfos.find(function (fileInfo) {
                return fileInfo.dir === srcDir;
            })

            if (!match) {
                // push the source dir
                fileInfos.push(fileInfo(setInitConfigOnFileInfo({
                    dir: srcDir,
                })));
                
                // push any sub dirs
                var dirs = util.getDirsSync(srcDir, true);
                dirs.forEach(function (dir) {
                    fileInfos.push(fileInfo(setInitConfigOnFileInfo({
                        dir: srcDir,
                    })));
                });
            }
        })

    }
    
    // Initializes all the file info objects
    var initializeFileInfos = function () {
        loadFileInfosSync();

        for (var i = 0; i < fileInfos.length; i++) {
            fileInfos[i].initialize()
        }
    }

    var saveAllFileInfosSync = function () {
        for (var i = 0; i < fileInfos.length; i++) {
            fileInfos[i].saveFileInfo(true);
        }
    }
    
    // Initialize the application instance
    var initialize = function (instance) {
        // load in config settings
        var configString = fs.readFileSync("./resource/config.txt");
        configData = JSON.parse(configString);

        fileInfosDir = configData["fileInfosDir"] || './data';

        imageSrcDirs = configData["imgSrcDir"];

        backupDir = configData["backupDir"] || './data';

        initializeFileInfos();
        saveAllFileInfosSync();
    }
    
    // Create an app instance ////
    
    var instance = {
        // An instance of express used for routing server requests.
        expressInstance: express(),

        // Moves the files marked for backup to the backup folder.
        moveFilesToBackupFolder: function (files) {
            var keepFiles = files || fileInfos[0].getFilteredMetadata(function (data) { return data.keep == true; });

            for (var i = 0; i < keepFiles.length; i++) {
                var currentFilePath = keepFiles[i].getPath();
                var backupFilePath = backupDir + keepFiles[i].getPartialPath();

                (function (source, dest, meta, app) {
                    util.copyFile(source, dest, function () {
                        console.log("Done copying file " + dest);
                        meta.backedUp = true;
                        meta.backupPath = dest;
                        app.updateFileMetadata(meta.filename, meta);
                    });
                })(currentFilePath, backupFilePath, keepFiles[i], this);
            }
        },

        moveToBackupFolder: function (filename) {
            if (filename) {
                this.moveFilesToBackupFolder([fileInfos[0].getFileMetadata(filename)]);
            }
        },
        
        // Saves all the file infos synchronously
        saveAllFileInfosSync: function () {
            saveAllFileInfosSync();
        },
        
        getFileMetadata: function (filename) {
            return fileInfos[0].getFileMetadata(filename);
        },
        
        getFilePath: function (filename) {
            return fileInfos[0].getFilePath(filename);
        },
        
        isValidFile: function (filename) {
            return fileInfos[0].isValidFile(filename);
        },
        
        getNextValidFile: function () {
            return fileInfos[0].getNextValidFile();
        },
        
        getPrevValidFile: function () {
            return fileInfos[0].getPrevValidFile();
        },
        
        updateFileMetadata: function (filename, updateMeta) {
            return fileInfos[0].updateFileMetadata(filename, updateMeta);
        },
    };

    // Initialize the application instance
    initialize();

    return instance;
}

module.exports = createCuratorApp;