var pathModule = require('path');

var createFileMetadata = function (init) {
    init = init || {};
    
    return {
        filename: init.filename || '',
        path: init.path || '',
        keep: init.keep || false,
        tags: init.tags || [],
        index: init.index >= 0 ? init.index : -1,
        
        // Gets the full path to the file including filename
        getPath: function() {
            return this.path + pathModule.sep +  this.filename;
        },
        
        // Gets a partial path to the file which is the parent folder and filename
        // The partial path includes a file separator character at the beginning of the path
        getPartialPath: function() {
            var parentIndex = this.path.lastIndexOf(pathModule.sep)
            var parent = this.path.substr(parentIndex);
            return parent + pathModule.sep + this.filename;
        },
    }
}

module.exports = createFileMetadata;