var fs = require('fs');
var pathModule = require('path');
var mkdirpModule = require('mkdirp');
var cv = require('opencv');
var tmp = require('tmp');

var contentTypes = {
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpg',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.js': 'text/javascript',
    '.css': "text/css",
}

// Helper functions ///////////////////////////////////////////
 
/**
 * Gets the values of the query string object as a single string
 * @param {string} query : The query string
 * @param {string} strNewline : The character to use for newlines
 */
module.exports.getQueryValueString = function (query, strNewline) {
    strNewline = strNewline || '\n';
    var queryVals = '';
    for (var prop in query) {
        queryVals += prop + ':' + query[prop] + strNewline;
    }
    return queryVals;
}

/**
 * Retrieves the content type using the extension of the file
 * passed in the path parameter
 * @param {string} path : The full path name
 */
module.exports.getContentType = function (path) {
    path = path || '';
    var i = path.lastIndexOf('.');
    if (i > -1) {
        return contentTypes[path.substr(i)];
    }
}

var model = null;
var getRecognizer = function() {
    if (model === null) {
        model = cv.FaceRecognizer.createEigenFaceRecognizer();
        model.loadSync('./resource/ethan.xml');
    }
    return model;
}

var FACE_WIDTH = 92;
var FACE_HEIGHT = 112;

var dumpFace = function(image, face, i) {
    var crop = image.crop(face.x, face.y, face.width, face.height);
    crop.resize(FACE_WIDTH, FACE_HEIGHT);
    crop.save('./tmp/face' + i + '.png');
}

module.exports.detectEthan = function(image, face, i) {
    var crop = image.crop(face.x, face.y, face.width, face.height);
    crop.resize(FACE_WIDTH, FACE_HEIGHT);
    
    var model = getRecognizer();
    var res = model.predictSync(crop);
    // positive
    if (res.id === 1 && res.confidence < 4000) {
        dumpFace(image, face, 'rec' + i);
        return true;
    }

    return false;
}

var deleteTempFaceFiles = function(deleteDone) {
    fs.readdir('./tmp', function (error, files) {
        if (error) throw error;

        files.filter(function (fileName) {
            return /face.*\.png/.test(fileName);
        })
        .forEach(function (file) {
            fs.unlink('./tmp/' + file);
        });

        deleteDone();
    });
}

/**
 * Detects a face in the given file.
 * @param {string} path : The full path to an image file to detect faces in
 * @param {function} callback : A callback function executed when the facial recognition is complete.
 * It returns 
 */
module.exports.detectFace = function(path, callback) {
    cv.readImage(path, function(err, im) {
        if (err) callback(false, path);

        im.detectObject(cv.FACE_CASCADE, {}, function(err, faces) {
            if (err || !faces || faces.length == 0) {
                console.log('No faces detected returning ' + path);
                callback(false, path);
                return;
            }

            console.log('Face(s) detected');
            for (var i = 0; faces && i < faces.length; i++) {
                var face = faces[i];
                dumpFace(im, face, i);

                // Check if it's Ethan!
                if (exports.detectEthan(im, face, i)) {
                    console.log("Face " + i + " is Ethan!");
                }

                // Draw a red ellipse
                im.ellipse( face.x + face.width / 2,
                            face.y + face.height / 2,
                            face.width / 2,
                            face.height / 2 );   
            }
            
            tmp.tmpName({ template: './tmp/tmp-XXXXXX' }, function _tempNameGenerated(err, tmpPathName) {
                if (err) throw err;
                var i = path.lastIndexOf('.');
                var ext = path.substr(i);
                var tempPath = tmpPathName + ext;
                console.log("Created temporary filename: ", tempPath)
                im.save(tempPath)
                
                callback(false, tempPath);
            });
        });
    });
}

/**
 * Does face detection and then serves the file
 */
module.exports.serveAndDetectFace = function (res, path) {
    deleteTempFaceFiles(function () {
        exports.detectFace(path, function _faceDetectionComplete(err, servePath) {
            exports.serveFile(res, servePath, function _serveComplete() {
                // discard the face detected file if it exists.
                if (~servePath.indexOf('tmp/tmp-'))
                {
                    exports.deleteFile(servePath);
                }
            });
        });
    });
}

/** 
 * Serves a file to the response stream
 * @param {http.ServerResponse} res : the http.ServerResponse object
 * @param {string} path : the path of the file to serve
 */
module.exports.serveFile = function (res, path, serveComplete) {
    if (res && path) {
        fs.readFile(path, function (err, data) {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.log(path + ' not found returning 404 response');
                    res.writeHead(404);
                    res.end();
                }
                else {
                    throw err;
                }
            }
            else {
                console.log('Now serving ' + path);
                var contentType = module.exports.getContentType(path);
                if (contentType) {
                    res.writeHead(200, { 'Content-Type': contentType });
                }

                res.end(data);
            }

            serveComplete();
        });
    }
}

/** 
 * Serves a javascript object as the response.  Can optionally use jsonp to return the object by supplying a callback
 * method name.
 * @param {http.ServerResponse} res : the http.ServerResponse object
 * @param {object} obj : the javascript object to return in the response as a JSON string
 * @param {string} callback : an optional string containing the name of a callback function to wrap around the JSON object string
 */
module.exports.serveJavascriptObject = function (res, obj, callback) {
    if (callback) {
        res.writeHead(200, { 'Content-type': 'application/javascript' });
        res.end(callback + '(' + JSON.stringify(obj) + ');');
    }
    else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
    }
}

/** 
 * Copy a file from the srcFilePath to dstFilePath asynchronously
 * @param {string} srcFilePath : the source file path
 * @param {string} dstFilePath : the destination file path
 * @param {function} onComplete : a function to execute once the file copy has completed
 */
module.exports.copyFile = function (srcFilePath, dstFilePath, onComplete) {
    console.log('Copying ' + srcFilePath + ' to ' + dstFilePath);

    var readStream = fs.createReadStream(srcFilePath);

    readStream.on('error', function (err) {
        console.log("Error on readstream: " + err);
    });

    // do the copy
    readStream.on('open', function (fd) {
        var dstDir = dstFilePath.substring(0, dstFilePath.lastIndexOf(pathModule.sep));
        mkdirpModule(dstDir, function (err) {
            if (err) {
                console.log("Failed to mkdirp " + dstDir + " Error:" + err);
            }
            else {
                var writeStream = fs.createWriteStream(dstFilePath);

                writeStream.on('error', function (err) {
                    console.log("Error on writestream: " + err);
                });

                writeStream.on('finish', onComplete);

                writeStream.on('open', function (fd) {
                    readStream.pipe(writeStream);
                })
            }
        });
    });
}

/**
 * Deletes a file
 * @param {string} deleteFilePath : The path to the file to be deleted.
 * @param {function} onComplete : A callback function executed after the file has been deleted.
 */
module.exports.deleteFile = function (deleteFilePath, onComplete) {
    console.log("Attempting to delete file " + deleteFilePath);
    fs.unlink(deleteFilePath, function _fileDeleted(err) {
        if (err) {
            console.log("Error deleting the file " + deleteFilePath + ": " + err);
        }
        else {
            console.log("Deleted " + deleteFilePath);
        }
        
        if (typeof onComplete === 'function') {
            onComplete(err);
        }
    });
}

/**
 * Get the directories in a given path
 * @param {string} path : The path for which directories are to be listed.
 * @param {bool} recurse : Flag indicating if the listing should recurse into subdirectories.
 * @return {stiring []} An array of the directories
 */
module.exports.getDirsSync = function (path, recurse) {
    console.log("Getting dirs for " + path)
    var dirInfo = fs.readdirSync(path);
    var result = [];

    dirInfo.map(function (file) {
        return pathModule.join(path, file);
    }).filter(function (file) {
        return !fs.statSync(file).isFile();
    }).forEach(function (file) {
        result.push(file);
    })

    if (recurse) {
        var subdirs = [];
        result.forEach(function (subdir) {
            subdirs = subdirs.concat(module.exports.getDirsSync(subdir, recurse));
        })
        result = result.concat(subdirs);
    }

    return result;
}

/**
 * Gets a listing of the files in the directory
 * @param {string} path : The path of the directory for which files are listed.
 * @return {string []} : An array containing the names of the files.
 */
module.exports.getFilesInDirSync = function (path) {
    var dirInfo = fs.readdirSync(path);
    var result = [];

    dirInfo.map(function (file) {
        return pathModule.join(path, file);
    }).filter(function (file) {
        return fs.statSync(file).isFile();
    }).forEach(function (file) {
        result.push(file);
    })
    
    return result;
}