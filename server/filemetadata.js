var createFileMetadata = function (init) {
    init = init || {};
    
    return {
        filename: init.filename || '',
        path: init.path || '',
        keep: init.keep || false,
        tags: init.tags || [],
        index: init.index >= 0 ? init.index : -1,
    }
}

module.exports = createFileMetadata;