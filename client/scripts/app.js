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
    
    // Setup image tagging
    var taggle = new Taggle('tags', {
        onTagAdd: function (event, tag) {
            $.getJSON('/action?button=tag&ajax=true&tag=' + tag, function (data) {
                console.log(data);
                setCurrentFileInfo(fileMetadata(data));
            });
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
        taggle.removeAll();
        console.log(event);
        $.getJSON('/action?button=next&ajax=true', function (data) {
            console.log(data);
            setCurrentFileInfo(fileMetadata(data));
        });
    }

    function mySwipeRightHandler(event) {
        taggle.removeAll();
        console.log(event);
        $.getJSON('/action?button=prev&ajax=true', function (data) {
            console.log(data);
            setCurrentFileInfo(fileMetadata(data));
        });
    }

    function mySwipeUpHandler(event) {
        taggle.removeAll();
        console.log(event);
        if (currentFileInfo.filename) {
            $.getJSON('/action?button=keep&ajax=true&filename=' + currentFileInfo.filename, function (data) {
                console.log(data);
                setCurrentFileInfo(fileMetadata(data), false);
            });
        }
    }

    function mySwipeDownHandler(event) {
        taggle.removeAll();
        console.log(event);
        if (currentFileInfo.filename) {
            $.getJSON('/action?button=unkeep&ajax=true&filename=' + currentFileInfo.filename, function (data) {
                console.log(data);
                setCurrentFileInfo(fileMetadata(data), false);
            });
        }
    }

} ());
