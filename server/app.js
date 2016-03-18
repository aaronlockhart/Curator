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
            var match = false;
            for (var i = 0; i < fileInfos.length; i++) {
                var info = fileInfos[i];
                console.log("Testing " + info.getSrcDir() + " === " + srcDir);
                if (info.getSrcDir() === srcDir) {
                    match = true;
                    break;
                }
            }

            if (!match) {
                console.log("Bootstrapping " + srcDir);
                
                // push the source dir
                fileInfos.push(fileInfo(setInitConfigOnFileInfo({
                    dir: srcDir,
                })));
                
                // push any sub dirs
                var dirs = util.getDirsSync(srcDir, true);
                console.log("Got dirs " + dirs);
                dirs.forEach(function (subDir) {
                    fileInfos.push(fileInfo(setInitConfigOnFileInfo({
                        dir: subDir,
                    })));
                });
            }
        })

    }
    
    // Initializes all the file info objects
    var initializeFileInfos = function () {
        loadFileInfosSync();

        for (var i = 0; i < fileInfos.length; i++) {
            if (!fileInfos[i].initialize()) {
                var path = fileInfos[i].getPath();
                util.deleteFile(path);
                fileInfos.splice(i, 1);
            }
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
        // meta - an array of metadata to move
        moveFilesToBackupFolder: function (fileIds) {
            for (var i = 0; i < fileIds.length; i++) {
                var index = this.getFileInfoIndexFromId(fileIds[i]);
                var filename = this.getFilenameFromId(fileIds[i]);
                var info = fileInfos[index];

                if (info && filename) {
                    var keepFileMeta = info.getFileMetadata(filename);
                    var currentFilePath = keepFileMeta.getPath();
                    var backupFilePath = backupDir + keepFileMeta.getPartialPath();

                    (function (source, dest, meta, app) {
                        util.copyFile(source, dest, function () {
                            console.log("Done copying file " + dest);
                            meta.backedUp = true;
                            meta.backupPath = dest;
                            app.updateFileMetadata(meta.filename, meta);
                        });
                    })(currentFilePath, backupFilePath, keepFileMeta, this);
                }
            }
        },

        moveToBackupFolder: function (fileId) {
            this.moveFilesToBackupFolder([fileId]);
        },
        
        // Saves all the file infos synchronously
        saveAllFileInfosSync: function () {
            saveAllFileInfosSync();
        },

        getFileInfoIndexFromId: function (fileId) {
            if (fileId && fileId.indexOf(':') > 0) {
                return fileId.split(':')[0];
            }
        },

        getFilenameFromId: function (fileId) {
            if (fileId && fileId.indexOf(':') > 0) {
                return fileId.split(':')[1];
            }
        },

        getFileMetadata: function (fileId) {
            var index = this.getFileInfoIndexFromId(fileId) || currInfoIndex;
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index] || fileInfos[currInfoIndex];

            if (info) {
                console.log("Getting metadata for " + filename + " from info " + currInfoIndex);
                var meta = info.getFileMetadata(filename)
                var fakeMeta = {
                    filename: index + ':' + meta.filename,
                    keep: meta.keep,
                    tags: meta.tags,
                }
                return fakeMeta;
            }
        },

        getFilePath: function (fileId) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index];

            if (info) {
                return info.getFilePath(filename);
            }
        },

        isValidFile: function (fileId) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index];

            if (info) {
                return info.isValidFile(filename);
            }
        },

        getNextValidFile: function () {
            var hasNextValidFile = false;
            var info = fileInfos[currInfoIndex];

            if (info) {
                hasNextValidFile = info.getNextValidFile();
            }

            while (!hasNextValidFile && currInfoIndex + 1 < fileInfos.length) {
                console.log("Moving to next file info");
                currInfoIndex = currInfoIndex + 1;
                
                if (!fileInfos[currInfoIndex].isValidFile()) {
                    hasNextValidFile = fileInfos[currInfoIndex].getNextValidFile();
                }
                else {
                    hasNextValidFile = true;
                }
            }

            if (!hasNextValidFile) {
                console.log("No next info could be found");
            }
        },

        getPrevValidFile: function () {
            var hasPrevValidFile = false;
            var info = fileInfos[currInfoIndex];

            if (info) {
                hasPrevValidFile = info.getPrevValidFile();
            }

            while (!hasPrevValidFile && currInfoIndex - 1 > -1) {
                console.log("Moving to previous file info");
                currInfoIndex = currInfoIndex - 1;
                
                if (!fileInfos[currInfoIndex].isValidFile()) {
                    hasPrevValidFile = fileInfos[currInfoIndex].getPrevValidFile();
                }
                else {
                    hasPrevValidFile = true;
                }
            }

            if (!hasPrevValidFile) {
                console.log("No prev info could be found");
            }
        },

        updateFileMetadata: function (fileId, updateMeta) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index];

            if (info) {
                return info.updateFileMetadata(filename, updateMeta);
            }
        },

        addTag: function (fileId, tag) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index];

            if (info) {
                return info.addTag(filename, tag);
            }
        },

        removeTag: function (fileId, tag) {
            var index = this.getFileInfoIndexFromId(fileId);
            var filename = this.getFilenameFromId(fileId);
            var info = fileInfos[index];

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