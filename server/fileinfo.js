/** 
 * Module to create a new file info instance used to maintain the metadata for each file
 */
var fileMetadata = require('./filemetadata');
var fs = require('fs');
var pathModule = require('path');

var nextFileId = -1;

/**
* Gets the next valid file id
*/
var getNextFileId = function() {
    return ++nextFileId;
}

var fastForwardToId = function(id) {
    while (id > nextFileId) {
        getNextFileId();
    }
}

/**
 * Creates a file info object which manages the file metadata for the files in a directory
 * @constructor
 */
function FileInfo(init) {
    init = init || {};

    if (init.dir) {
        console.log("Creating new file info for " + init.dir);
    }

    /**
     *  Private Data
     */

    /**
     * The current directory
     */
    var dir = init.dir || '';

    /**
     * The current file
     */
    var currFile = init.currFile || undefined;

    /**
     * An array of the current files in the directory
     */
    var dirFiles = init.dirFiles || [];

    /**
     * Metadata for all the files in the current directory
     */
    var metadata = init.metadata || {};

    /**
     * A regular expression containing the types of file extensions that are considered valid for display (i.e .jpg, .gif)
     */
    var validFileTypes = init.validFileTypes || /\.*/i;

    /**
     * The base filename for file info
     */
    var filename = init.filename || 'fileInfo';

    /**
     * The file info extension
     */
    var ext = init.ext || '.txt';

    /**
     * The path to where file info is stored
     */
    var path = init.path || './data';

    /**
     * The index into dirFiles of the current file
     */
    var currFileIndex = -1;

    /**
     * A unique identifier for this file info
     */
    if (init.identifier) {
        fastForwardToId(init.identifier);
    }

    var identifier = init.identifier || getNextFileId();

    /**
     * Private Methods
     */
    
    /**
    * Gets the next available file from the file set.
    * returns true if getNextFile can be called again, false otherwise (i.e. is at the end of the file set)
    */
    var getNextFile = function() {
        if (currFileIndex < dirFiles.length - 1) {
            currFileIndex += 1;
            currFile = dirFiles[currFileIndex];
            return true;
        }

        return false;
    }

    /**
    * Gets the previous available file from the file set.
    * returns true if getPrevFile can be called again, false otherwise (i.e. is at the beginning of the file set)
    */
    var getPrevFile = function() {
        if (currFileIndex > 0) {
            currFileIndex -= 1;
            currFile = dirFiles[currFileIndex];
            return true;
        }

        return false;
    }

    /**
    * Uses an array of functions to try and find the next valid file
    *
    * @param {Object[]} funcArr : an array of functions with signature (fileInfo) => bool 
    * each function in the array will be called until either the function returns false
    * or the function sets a valid file for fileInfo.
    *
    * @param {string} currFunc : the index into funcArr which indicates the function being called
    *
    * returns : true if getValidFile can be called again, false if it is at the end of the file set
    */
    var getValidFile = function(funcArr, currFunc) {
        currFunc = currFunc || 0;
        var foundValidFileWithFirstFunc = false;

        if (currFunc < funcArr.length) {
            // use the current method until it returns false or a valid file
            // type is returned
            do {
                var res = funcArr[currFunc]();
                foundValidFileWithFirstFunc = isValidFile();
            }
            while (res && !foundValidFileWithFirstFunc);

            if (!foundValidFileWithFirstFunc) {
                // call the next function to try and find a file
                getValidFile(funcArr, ++currFunc);
            }
        }

        return res;
    }

    /**
    * Determines if the given file is a valid file type.  Uses the current file if
    * filename is null or undefined.
    * @param {string} filename - The filename, if undefined/null the current file is used
    * @returns {boolean} true if the file is a valid type, false otherwise
    */
    var isValidFile = function(filename) {
        filename = (filename || currFile) + "";
        return filename.match(validFileTypes) && metadata[filename];
    }

    /**
    * Initializes the file meta data, deleting old metadata of non-existant files and reindexing to the current directory
    */
    var initializeMetadata = function() {
        console.log("Initializing metadata");

        for (var key in metadata) {
            if (metadata.hasOwnProperty(key)) {

                // make into a real metadata object
                metadata[key] = fileMetadata(metadata[key]);
                metadata[key].touch = false;
            }
        }

        dirFiles = fs.readdirSync(dir);

        // make sure we're at the start..
        while (getPrevFile());

        // build meta data
        while (getNextFile()) {
            console.log("Building metadata for " + currFile + " at index " + currFileIndex + "\n");
            if (!metadata.hasOwnProperty(currFile)) {
                metadata[currFile] = fileMetadata({
                    filename: currFile,
                    path: dir,
                    keep: false,
                    index: currFileIndex,
                })

                metadata[currFile].touch = true;
            }
            else {
                // update the index
                metadata[currFile].index = currFileIndex;
                metadata[currFile].path = dir;
                metadata[currFile].touch = true;
            }
        }

        for (var key in metadata) {
            if (metadata.hasOwnProperty(key)) {
                if (!metadata[key].touch) {
                    delete metadata[key];
                }
                else {
                    delete metadata[key].touch;
                }
            }
        }

        console.log("Metadata initialized");
        console.log(metadata);
    }

    /**
     *  Return a new object instance
     */
    return {

        /**
        * Gets the base directory for this fileInfo object
        */
        getSrcDir: function() {
            return dir;
        },

        /**
        * Gets the next valid file from the file set
        *
        * @returns {boolean} true if a valid file was found, false otherwise
        */
        getNextValidFile: function() {
            return getValidFile([getNextFile, getPrevFile]);
        },

        /**
        * Gets the previous valid file from the file set
        *
        * @returns {boolean} true if a valid file was found, false otherwise
        */
        getPrevValidFile: function() {
            return getValidFile([getPrevFile, getNextFile]);
        },

        /**
        * Retrieves a list of files and sets the next valid file
        */
        initialize: function() {
            try {
                initializeMetadata();
            }
            catch (e) {
                console.log(e)
                return false;
            }

            // move to start
            while (getPrevFile());

            // move to first valid file
            if (!isValidFile()) {
                this.getNextValidFile();
            }

            return true;
        },

        /**
        * Determines if the given file is a valid file type.
        *  
        * @param {string} filename - the filename to check.  Uses the current file if
        * filename is null or undefined.
        */
        isValidFile: function(filename) {
            return isValidFile(filename);
        },

        /**
        * Gets the file meta data for the given filename or the current file if filename is undefined or null
        *
        * @param {string} filename - the filename to get meta data for or undefined/null if the current file is to be used
        */
        getFileMetadata: function(filename) {
            filename = filename || currFile;
            return metadata[filename];
        },

        /**
        * Updates the metadata for a given filename
        *
        * @param {string} filename - the name of the metadata to update or if undefined/null the current file is used
        * @param {any} updateMeta - an object representing the properties of the metadata to update
        */
        updateFileMetadata: function(filename, updateMeta) {
            filename = filename || currFile;
            console.log("Updating metadata for " + filename);

            var myMeta = this.getFileMetadata(filename);
            if (myMeta) {
                console.log("Found matching meta " + myMeta.filename);

                for (var key in updateMeta) {
                    if (myMeta.hasOwnProperty(key)) {
                        myMeta.updateProperty(key, updateMeta[key]);
                    }
                }
            }
        },

        /**
        * Delete a metadata object from metadata and dirFiles.. not sure what side effects this has..
        */
        deleteFileMetadata: function(deleteMeta) {
            if (deleteMeta) {
                var matchingMeta = metadata[deleteMeta.filename];
                if (matchingMeta) {
                    console.log("Deleting metadata " + deleteMeta.filename);
                    delete metadata[deleteMeta.filename];
                    dirFiles.splice(deleteMeta.index, 1);
                }
            }
        },

        /**
         * Saves the file info to a specified location
         * sync: whether to the file is written synchronously (true) or not (false)
         */
        saveFileInfo: function(sync) {
            var content = JSON.stringify({
                "dir": dir,
                "identifier": identifier,
                "metadata": metadata,
            });

            var path = this.getPath();
            if (sync) {
                fs.writeFileSync(path, content);
            }
            else {
                fs.writeFile(path, content, function(err) {
                    if (err) throw err;
                    console.log('Saved fileinfo');
                })
            }
        },

        /** 
         * Adds a tag to the file's metadata
         */
        addTag: function(filename, tag) {
            var filedata = this.getFileMetadata(filename);
            if (filedata) {
                var index = filedata.tags.indexOf(tag);
                // Only add if it doesn't exist already
                if (index == -1) {
                    console.log("Adding tag " + tag + " for file " + filedata.filename);
                    filedata.tags.push(tag);
                }
            }
        },

        /**
         * Removes a tag from the file's metadata
         */
        removeTag: function(filename, tag) {
            var filedata = this.getFileMetadata(filename);
            if (filedata) {
                var index = filedata.tags.indexOf(tag);
                if (index > -1) {
                    console.log("Removing tag " + tag + " for file " + filedata.filename);
                    filedata.tags.splice(index, 1);
                }
            }
        },

        /**
         * Gets the path to the file info data
         */
        getPath: function() {
            return path + pathModule.sep + filename + "_" + identifier + ext;
        },

        /**
         * Gets the path to the given file name so that it can be located on disk.
         */
        getFilePath: function(filename) {
            var meta = this.getFileMetadata(filename);
            return meta.getPath();
        },

        /**
         * Returns an array of filtered metadata
         */
        getFilteredMetadata: function(filter) {
            var result = [];

            for (var i = 0; i < dirFiles.length; i++) {
                var meta = this.getFileMetadata(dirFiles[i]);
                if (filter(meta)) {
                    // pushes a copy
                    result.push(fileMetadata(meta));
                }
            }

            return result;
        },
    };
}

module.exports = FileInfo;