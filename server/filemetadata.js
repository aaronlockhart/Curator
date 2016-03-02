var createFileMetadata = function (init) {
    init = init || {};
    var instance = {};
    instance.filename = init.filename || '';
    instance.path = init.path || '';
    instance.keep = init.keep || false;
    instance.tags = init.tags || [];
    instance.index = init.index >= 0 ? init.index : -1;

    return instance;
}

module.exports = createFileMetadata;