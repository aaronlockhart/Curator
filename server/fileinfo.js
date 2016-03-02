var fileMetadata = require('./filemetadata');
var fs = require('fs');

var createFileInfo = function (init) {
    init = init || {};
    var instance = {};

    instance.dir = init.dir || '';
    instance.currFile = init.currFile || undefined;
    instance.dirFiles = init.dirFiles || [];
    instance.fileMetadata = init.fileMetadata || {};
    instance.validFileTypes = init.validFileTypes || /\.*/i;
    instance.fileInfoFilename = init.fileInfoFilename || './fileInfo.txt';
    instance.currFileIndex = -1;
    
    // getNextFile(fileInfo)
    //
    // Gets the next file for the given fileInfo object
    // returns true if getNextFile can be called again, false otherwise (i.e. is at the end of the file set)
    instance.getNextFile = function () {
        if (instance.currFileIndex < instance.dirFiles.length - 1) {
            instance.currFileIndex += 1;
            instance.currFile = instance.dirFiles[instance.currFileIndex];
            return true;
        }

        return false;
    }

    // getPrevFile(fileInfo)
    //
    // Gets the previous file for the given fileInfo object
    // returns true if getPrevFile can be called again, false otherwise (i.e. is at the beginning of the file set)
    instance.getPrevFile = function () {
        if (instance.currFileIndex > 0) {
            instance.currFileIndex -= 1;
            instance.currFile = instance.dirFiles[instance.currFileIndex];
            return true;
        }

        return false;
    }
    
    // getNextValidFile()
    //
    // Gets the next valid file
    //
    // Returns: true if a valid file was found, false otherwise
    instance.getNextValidFile = function () {
        return instance.getValidFile([instance.getNextFile, instance.getPrevFile]);
    }
    
    // getPrevValidFile()
    //
    // Gets the previous valid file
    //
    // Returns: true if a valid file was found, false otherwise
    instance.getPrevValidFile = function () {
        return instance.getValidFile([instance.getPrevFile, instance.getNextFile]);
    }
    
    // getNextValidFile(funcArr, fileInfo, currMethod)
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
    instance.getValidFile = function (funcArr, currFunc) {
        currFunc = currFunc || 0;

        if (currFunc < funcArr.length) {
            // use the current method until it returns false or a valid file
            // type is returned
            do {
                var res = funcArr[currFunc]();
            }
            while (res && !instance.isValidFile());

            if (!instance.isValidFile()) {
                // call the next function to try and find a file
                instance.getValidFile(funcArr, ++currFunc);
            }

            return true;
        }

        return false;
    }

    // initializeMetadata()
    //
    // Initializes the file meta data, deleting old metadata of non-existant files and reindexing to the current directory
    instance.initializeMetadata = function () {
        console.log("Initializing metadata");

        for (var key in instance.fileMetadata) {
            if (instance.fileMetadata.hasOwnProperty(key)) {
                instance.fileMetadata[key].touch = false;
            }
        }

        instance.dirFiles = fs.readdirSync(instance.dir);
        
        // make sure we're at the start..
        while (instance.getPrevFile());
        
        // build meta data
        while (instance.getNextFile()) {
            console.log("Building metadata for " + instance.currFile + " at index " + instance.currFileIndex + "\n");
            if (!instance.fileMetadata.hasOwnProperty(instance.currFile)) {
                instance.fileMetadata[instance.currFile] = fileMetadata({
                    filename: instance.currFile,
                    path: instance.dir,
                    keep: false,
                    index: instance.currFileIndex,
                })

                instance.fileMetadata[instance.currFile].touch = true;
            }
            else {
                // update the index
                instance.fileMetadata[instance.currFile].index = instance.currFileIndex;
                instance.fileMetadata[instance.currFile].touch = true;
            }
        }

        for (var key in instance.fileMetadata) {
            if (instance.fileMetadata.hasOwnProperty(key)) {
                if (!instance.fileMetadata[key].touch) {
                    delete instance.fileMetadata[key];
                }
                else {
                    delete instance.fileMetadata[key].touch;
                }
            }
        }

        console.log("Metadata initialized");
        console.log(instance.fileMetadata);
    }
    
    // initialize()
    // 
    // Retrieves a list of files and sets the next valid file
    instance.initialize = function () {
        try {
            var fileInfoString = fs.readFileSync(instance.fileInfoFilename);
            console.log("Loading existing file " + instance.fileInfoFilename);
            var fileInfoData = JSON.parse(fileInfoString)
            fileInfoData.dir = instance.dir;
            var fragments = fileInfoData.validFileTypes.match(/\/(.*?)\/([gimy])?$/);
            fileInfoData.validFileTypes = new RegExp(fragments[1], fragments[2] || '');
            instance = createFileInfo(fileInfoData);
            instance.initializeMetadata();
        }
        catch (e) {
            console.log("Existing file " + instance.fileInfoFilename + " not found, initializing meta data for " + instance.dir);
            instance.initializeMetadata();
        }
        
        // move to start
        while (instance.getPrevFile());
        
        // move to first valid file
        if (!instance.isValidFile()) {
            instance.getNextValidFile();
        }
    }

    // isValidFile(fileInfo)
    //
    // Determines if the next file is a valid file type
    instance.isValidFile = function (filename) {
        filename = (filename || instance.currFile) + "";
        return filename.match(instance.validFileTypes) && instance.fileMetadata[filename];
    }
    
    // getFileMetadata(filename)
    // 
    // Gets the file meta data for the given filename or the current file if filename is undefined or null
    //
    // filename: the filename to get meta data for or undefined/null if the current file is to be used
    instance.getFileMetadata = function (filename) {
        filename = filename || instance.currFile;
        return instance.fileMetadata[filename];
    }
    
    // updateMetadata(filename, val)
    //
    // filename: the name of the metadata to update or if undefined/null the current file is used
    // val: an object representing the properties of the metadata to update
    instance.updateFileMetadata = function (filename, val) {
        filename = filename || instance.currFile;
        var metadata = instance.getFileMetadata(filename);
        for (var key in val) {
            if (metadata.hasOwnProperty(key)) {
                metadata[key] = val[key];
            }
        }
    }

    // saveFileInfo(sync)
    // 
    // Saves the file info to a specified location
    // sync: whether to the file is written synchronously (true) or not (false)
    instance.saveFileInfo = function (sync) {
        var content = JSON.stringify(instance);
        if (sync) {
            fs.writeFileSync(instance.fileInfoFilename, content);
        }
        else {
            fs.writeFile(instance.fileInfoFilename, content, function (err) {
                if (err) throw err;
                console.log('Saved fileinfo');
            })
        }
    }

    return instance;
}

module.exports = createFileInfo;