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

        return that;
    }

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

        if (fetch) {
            $("#image").attr("src", "/file?filename=" + currentFileInfo.filename);
        }
    }

    function mySwipeLeftHandler(event) {
        console.log(event);
        $.getJSON('/action?button=next&ajax=true', function (data) {
            console.log(data);
            setCurrentFileInfo(fileMetadata(data));
        });
    }

    function mySwipeRightHandler(event) {
        console.log(event);
        $.getJSON('/action?button=prev&ajax=true', function (data) {
            console.log(data);
            setCurrentFileInfo(fileMetadata(data));
        });
    }

    function mySwipeUpHandler(event) {
        console.log(event);
        if (currentFileInfo.filename) {
            $.getJSON('/action?button=keep&ajax=true&filename=' + currentFileInfo.filename, function (data) {
                console.log(data);
                setCurrentFileInfo(fileMetadata(data), false);
            });
        }
    }

    function mySwipeDownHandler(event) {
        console.log(event);
        if (currentFileInfo.filename) {
            $.getJSON('/action?button=unkeep&ajax=true&filename=' + currentFileInfo.filename, function (data) {
                console.log(data);
                setCurrentFileInfo(fileMetadata(data), false);
            });
        }
    }
}());
