var pathModule = require('path');
var util = require('./util');

var createFileMetadata = function (init) {
    init = init || {};

    return {
        // The filename
        filename: init.filename || '',
        
        // The path to the file (not including filename)
        path: init.path || '',
        
        // A flag inidicating if this file is marked for backup
        keep: init.keep || false,
        
        // Tags for the image
        tags: init.tags || [],
        
        // The current index of the file
        index: init.index >= 0 ? init.index : -1,
        
        // A flag indicating if the file has been backed up
        backedUp: init.backedUp === undefined ? false : init.backedUp,
        
        // The full path (including filename) of the backup file
        backupPath: init.backupPath || '',
        
        // Gets the full path to the file including filename
        getPath: function () {
            return this.path + pathModule.sep + this.filename;
        },
        
        // Gets a partial path to the file which is the parent folder and filename optionally 
        // appends the filename to the path.
        //
        // The partial path includes a file separator character at the beginning of the path
        getPartialPath: function (appendFileName) {
            appendFileName = appendFileName === undefined ? true : appendFileName;

            var parentIndex = this.path.lastIndexOf(pathModule.sep)
            var parent = this.path.substr(parentIndex);
            if (appendFileName) {
                return parent + pathModule.sep + this.filename;
            }
            else {
                return parent;
            }
        },

        updateProperty: function (property, newValue) {
            var previousValue = this[property];
            this[property] = newValue;

            if (previousValue !== newValue) {
                if (this.metadataChanged) {
                    this.metadataChanged(property, previousValue, newValue);
                }
            }
        },

        metadataChanged: function (property, previousValue, newValue) {
            if (property === "keep" && newValue == false && previousValue == true && this.backedUp) {
                
                var onDelete = function (metadata) {
                    return function (err) {
                        if (err) {
                            console.log("Keep status changed to false, but error occured trying to delete backup file. " + err);
                        }
                        console.log("Keep status changed to false, file deleted from backup");
                        metadata.backedUp = false;
                        metadata.backupPath = '';
                    }
                }(this);
                
                util.deleteFile(this.backupPath, onDelete);
            }
        }
    }
}

module.exports = createFileMetadata;