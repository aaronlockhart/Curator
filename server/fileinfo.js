var fileMetadata = require('./filemetadata');
var fs = require('fs');

var createFileInfo = function (init) {
    init = init || {};

    
    // Private Data ////////////////////////////////////
    var dir = init.dir || '';
    var currFile = init.currFile || undefined;
    var dirFiles = init.dirFiles || [];
    var metadata = init.metadata || {};
    var validFileTypes = init.validFileTypes || /\.*/i;
    var fileInfoFilename = init.fileInfoFilename || './fileInfo.txt';
    var currFileIndex = -1;
    
    // Private Methods /////////////////////////////////
    
    // getNextFile(fileInfo)
    //
    // Gets the next file for the given fileInfo object
    // returns true if getNextFile can be called again, false otherwise (i.e. is at the end of the file set)
    var getNextFile = function () {
        if (currFileIndex < dirFiles.length - 1) {
            currFileIndex += 1;
            currFile = dirFiles[currFileIndex];
            return true;
        }

        return false;
    }
    
    // getPrevFile(fileInfo)
    //
    // Gets the previous file for the given fileInfo object
    // returns true if getPrevFile can be called again, false otherwise (i.e. is at the beginning of the file set)
    var getPrevFile = function () {
        if (currFileIndex > 0) {
            currFileIndex -= 1;
            currFile = dirFiles[currFileIndex];
            return true;
        }

        return false;
    }
    
    // getValidFile(funcArr, fileInfo, currMethod)
    //
    // Uses an array of functions to try and find the next valid file
    //
    // funcArr : an array of functions with signature (fileInfo) => bool 
    // each function in the array will be called until either the function returns false
    // or the function sets a valid file for fileInfo.
    //
    // currFunc : the index into funcArr which indicates the function being called
    //
    // returns : true if a valid file was found, false otherwise
    var getValidFile = function (funcArr, currFunc) {
        currFunc = currFunc || 0;

        if (currFunc < funcArr.length) {
            // use the current method until it returns false or a valid file
            // type is returned
            do {
                var res = funcArr[currFunc]();
            }
            while (res && !isValidFile());

            if (!isValidFile()) {
                // call the next function to try and find a file
                getValidFile(funcArr, ++currFunc);
            }

            return true;
        }

        return false;
    }
    
    // isValidFile(fileInfo)
    //
    // Determines if the next file is a valid file type
    var isValidFile = function (filename) {
        filename = (filename || currFile) + "";
        return filename.match(validFileTypes) && metadata[filename];
    }
    
    // initializeMetadata()
    //
    // Initializes the file meta data, deleting old metadata of non-existant files and reindexing to the current directory
    var initializeMetadata = function () {
        console.log("Initializing metadata");

        for (var key in metadata) {
            if (metadata.hasOwnProperty(key)) {
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

    // Create a new instance object
    return {
        // getNextValidFile()
        //
        // Gets the next valid file
        //
        // Returns: true if a valid file was found, false otherwise
        getNextValidFile: function () {
            return getValidFile([getNextFile, getPrevFile]);
        },
    
        // getPrevValidFile()
        //
        // Gets the previous valid file
        //
        // Returns: true if a valid file was found, false otherwise
        getPrevValidFile: function () {
            return getValidFile([getPrevFile, getNextFile]);
        },
    
        // initialize()
        // 
        // Retrieves a list of files and sets the next valid file
        initialize: function () {
            try {
                var fileInfoString = fs.readFileSync(fileInfoFilename);
                console.log("Loading existing file " + fileInfoFilename);
                var fileInfoData = JSON.parse(fileInfoString)
                fileInfoData.dir = dir;
                var fragments = fileInfoData.validFileTypes.match(/\/(.*?)\/([gimy])?$/);
                fileInfoData.validFileTypes = new RegExp(fragments[1], fragments[2] || '');
                instance = createFileInfo(fileInfoData);
                initializeMetadata();
            }
            catch (e) {
                console.log("Existing file " + fileInfoFilename + " not found, initializing meta data for " + dir);
                initializeMetadata();
            }
        
            // move to start
            while (getPrevFile());
        
            // move to first valid file
            if (!isValidFile()) {
                this.getNextValidFile();
            }
        },

        isValidFile: function (filename) {
            return isValidFile(filename);
        },

        // getFileMetadata(filename)
        // 
        // Gets the file meta data for the given filename or the current file if filename is undefined or null
        //
        // filename: the filename to get meta data for or undefined/null if the current file is to be used
        getFileMetadata: function (filename) {
            filename = filename || currFile;
            return metadata[filename];
        },
    
        // updateMetadata(filename, val)
        //
        // filename: the name of the metadata to update or if undefined/null the current file is used
        // val: an object representing the properties of the metadata to update
        updateFileMetadata: function (filename, val) {
            filename = filename || currFile;
            var filedata = this.getFileMetadata(filename);
            for (var key in val) {
                if (filedata.hasOwnProperty(key)) {
                    filedata[key] = val[key];
                }
            }
        },

        // saveFileInfo(sync)
        // 
        // Saves the file info to a specified location
        // sync: whether to the file is written synchronously (true) or not (false)
        saveFileInfo: function (sync) {
            var content = JSON.stringify({ "metadata": metadata });
            if (sync) {
                fs.writeFileSync(fileInfoFilename, content);
            }
            else {
                fs.writeFile(fileInfoFilename, content, function (err) {
                    if (err) throw err;
                    console.log('Saved fileinfo');
                })
            }
        },

        getFilePath: function (filename) {
            var filedata = this.getFileMetadata(filename);
            return filedata.path + '\\' + filedata.filename;
        },
    };
}

module.exports = createFileInfo;