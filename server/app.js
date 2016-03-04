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
    
    var currInfoIndex = 0;
    
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
            var match = fileInfos.find(function (info) {
                console.log("Testing " + info.getSrcDir() + " === " + srcDir);
                return info.getSrcDir() === srcDir;
            });

            if (!match) {
                console.log("Bootstrapping " + srcDir);
                
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

        getFileInfoIndexFromId: function (fileid) {
            if (fileid && fileid.indexOf(':') > 0) {
                return fileid.split(':')[0];
            }
        },

        getFilenameFromId: function (fileid) {
            if (fileid && fileid.indexOf(':') > 0) {
                return fileid.split(':')[1];
            }
        },

        getFileMetadata: function (fileId) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index] || fileInfos[0];

            if (info) {
                var meta = info.getFileMetadata(filename)
                var fakeMeta = {
                    filename: index + ':' + filename,
                    keep: meta.keep,
                    tags: meta.tags,
                }
                return fakeMeta;
            }
        },

        getFilePath: function (fileId) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index] || fileInfos[0];
            return fileInfos[0].getFilePath(filename);
        },

        isValidFile: function (fileId) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index] || fileInfos[0];

            if (info) {
                return info.isValidFile(filename);
            }
        },

        getNextValidFile: function () {
            return fileInfos[currInfoIndex].getNextValidFile();
        },

        getPrevValidFile: function () {
            return fileInfos[currInfoIndex].getPrevValidFile();
        },

        updateFileMetadata: function (fileId, updateMeta) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index] || fileInfos[0];

            if (info) {
                return info.updateFileMetadata(filename, updateMeta);
            }
        },

        addTag: function (fileId, tag) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index] || fileInfos[0];

            if (info) {
                return info.addTag(filename, tag);
            }
        },

        removeTag: function (fileId, tag) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index] || fileInfos[0];

            if (info) {
                return info.removeTag(filename, tag);
            }
        },
    };

    // Initialize the application instance
    initialize();

    return instance;
}

module.exports = createCuratorApp;