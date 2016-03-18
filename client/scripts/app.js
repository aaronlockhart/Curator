/* global Taggle */
var app = (function () {
    $(document).ready(function () {
        var options = {
            recognizers: [
                [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL }],
            ]
        };

        $("#image").hammer(options).bind("swipeleft", mySwipeLeftHandler);
        $("#image").hammer(options).bind("swiperight", mySwipeRightHandler);
        $("#image").hammer(options).bind("swipeup", mySwipeUpHandler);
        $("#image").hammer(options).bind("swipedown", mySwipeDownHandler);

        getCurrentFileInfo(setCurrentFileInfo);

        $("#buttonForm").submit(function () {
            if (currentFileInfo.filename) {
                $("#filename").val(currentFileInfo.filename);
            }
        });
    });


    var fileMetadata = function (init) {
        init = init || {};
        var that = {};

        that.filename = init.filename || '';
        that.path = init.path || '';
        that.keep = init.keep || false;
        that.tags = init.tags || [];

        return that;
    }

    var clearingTags = false;
    
    // Setup image tagging
    var taggle = new Taggle('tags', {
        onTagAdd: function (event, tag) {
            $.getJSON('/action?button=tag&filename=' + currentFileInfo.filename + '&ajax=true&tag=' + tag, function (data) {
                console.log(data);
            });
        },
        onTagRemove: function (event, tag) {
            if (!clearingTags) {
                $.getJSON('/action?button=untag&filename=' + currentFileInfo.filename + 'ajax=true&tag=' + tag, function (data) {
                    console.log(data);
                });
            }
        }
    });

    var currentFileInfo = fileMetadata();

    function getCurrentFileInfo(currentInfoCallback) {
        $.getJSON('/currentFileInfo', function (data) {
            console.log(data);
            currentInfoCallback(fileMetadata(data));
        });
    }

    function setCurrentFileInfo(currentInfo, fetch) {
        fetch = fetch || true;
        currentFileInfo = currentInfo;

        if (currentFileInfo.keep) {
            $("#image").attr("class", "highlighted");
        }
        else {
            $("#image").attr("class", "");
        }

        for (i = 0; i < currentFileInfo.tags.length; i++) {
            taggle.add(currentFileInfo.tags[i]);
        }
        if (fetch) {
            $("#image").attr("src", "/file?filename=" + currentFileInfo.filename);
        }
    }

    function mySwipeLeftHandler(event) {
        clearTags();
        console.log(event);
        $.getJSON('/action?button=next&ajax=true', function (data) {
            console.log(data);
            setCurrentFileInfo(fileMetadata(data));
        });
    }

    function mySwipeRightHandler(event) {
        clearTags();
        console.log(event);
        $.getJSON('/action?button=prev&ajax=true', function (data) {
            console.log(data);
            setCurrentFileInfo(fileMetadata(data));
        });
    }

    function mySwipeUpHandler(event) {
        clearTags();
        console.log(event);
        if (currentFileInfo.filename) {
            $.getJSON('/action?button=keep&ajax=true&filename=' + currentFileInfo.filename, function (data) {
                console.log(data);
                setCurrentFileInfo(fileMetadata(data), false);
            });
        }
    }

    function mySwipeDownHandler(event) {
        clearTags();
        if (currentFileInfo.filename) {
            $.getJSON('/action?button=unkeep&ajax=true&filename=' + currentFileInfo.filename, function (data) {
                console.log(data);
                setCurrentFileInfo(fileMetadata(data), false);
            });
        }
    }

    // Clears the tags with a flag set to true so we don't send a message to the server to remove the tags from metadata
    function clearTags() {
        clearingTags = true;
        taggle.removeAll();
        clearingTags = false;
    }

} ());
