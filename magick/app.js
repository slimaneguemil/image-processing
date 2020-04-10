//https://www.npmjs.com/package/express-fileupload
//https://www.google.com/search?q=postman+post+multi-part&oq=postman+post+multi-part&aqs=chrome..69i57j33.7538j0j7&sourceid=chrome&ie=UTF-8#kpvalbx=_yFmMXsOqNMyRlwT9morgCA28
// with postman create a post request wit form-data
// create a key/value samplefile/file
//https://www.npmjs.com/package/probe-image-size
//https://sharp.pixelplumbing.com/api-resize
//https://www.npmjs.com/package/gm
var express =require('express');
var chalk = require('chalk');
const fs = require('fs');
const debug = require('debug')('app');
var async = require('async');
//var gm = require('gm');
gm = require('gm').subClass({imageMagick: true});

var app= express();

const fileUpload = require('express-fileupload');
const PORT = process.env.PORT || 4004;
const SHARP_FORMAT = process.env.SHARP_FORMAT || 'jpeg';
const SHARP_WIDTH = process.env.SHARP_WIDTH || null;
const SHARP_HEIGHT= process.env.SHARP_HEIGHT || null;
const SHARP_FIT= process.env.SHARP_FIT || 'contain';
const SHARP_RESOLUTION= process.env.SHARP_RESOLUTION || 266;
const MINPRINTSIZE = 3
const MAXPRINTSIZE = 3

// default options
app.use(fileUpload());

app.post('/info', async function(req,res){
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    let sampleFile = req.files.sampleFile.data;
    response={};
    async.waterfall([
            function intro(next) {
                debug('entering waterfall');
                next(null, response);
            },
            function getSize(response, next) {
                gm(sampleFile).size(function(err, size) {
                    debug(`size: ${JSON.stringify(size)}`);
                    // Transform the image buffer in memory.
                    response.width = size.width;
                    response.height = size.height;
                    next(null,response);
                });
            },
            function getResolution( response, next) {
                gm(sampleFile).res(function(err, resolution) {
                    debug(`resolution: ${resolution}`);
                    // Transform the image buffer in memory.
                    response.res = resolution || null ;
                    next(null,response);
                });

            },
            function getFilesize( response, next) {
                gm(sampleFile).filesize(function(err, filesize) {
                    debug(`filesize: ${filesize}`);
                    // Transform the image buffer in memory.
                    response.filesize = filesize;
                    next(null,response);
                });

            },
            function getFormat( response, next) {
            gm(sampleFile).format(function(err, format) {
                debug(`getFormat: ${format}`);
                // Transform the image buffer in memory.
                response.format = format || null ;
                next(null,response);
            });

        },
            function reply(response){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify(response));

            }
        ], function (err) {
            if (err) {
                console.error(
                    'Unable to resize '
                );
            } else {
                console.log('Successfully resized '  );

            }

            //  callback(null, "message");
        }
    );


});

app.post('/identity', async function(req,res){
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    let sampleFile = req.files.sampleFile.data;
    response={};
    async.waterfall([
            function intro(next) {
                debug('entering waterfall');
                next(null, response);
            },
            function getIdentity(response, next) {
                gm(sampleFile).identify(function(err, identity) {
                    debug(`size: ${JSON.stringify(identity)}`);
                    // Transform the image buffer in memory.
                    response.identity = identity;
                    next(null,response);
                });
            },

            function reply(response){
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify(response));

            }
        ], function (err) {
            if (err) {
                console.error(
                    'Unable to resize '
                );
            } else {
                console.log('Successfully resized '  );

            }

            //  callback(null, "message");
        }
    );


});
app.post('/setresolution', async function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    const width = req.query.width ? parseInt(req.query.width) : SHARP_WIDTH;
    const height = req.query.height ? parseInt(req.query.height) : SHARP_HEIGHT;
    const fit = req.query.fit ? req.query.fit : SHARP_FIT; // contain keep ratio
    const format = req.query.format ? req.query.format : SHARP_FORMAT;
    const resolution = req.query.resolution ? parseInt(req.query.resolution) : SHARP_RESOLUTION;

    debug(`param width: ${width}`);debug(`param width: ${height}`);
    debug(`param fit: ${fit}`);debug(`param format:' ${format}`);

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile.data;
    // debug('/ process before req:' + JSON.stringify(metadata));
    response= {};
   // set the header here
    async.waterfall([
            function intro(next) {
                debug('/setresolution entering waterfall');
                next(null, response);
            },
            function getFormat( response, next) {
            gm(sampleFile).format(function(err, format) {
                debug(`getFormat: ${format}`);
                if (err) {
                    next(err);
                } else {
                    res.set('Content-Type', `image/${format.toLowerCase()}`);
                    next(null,response);
                }

            });

        },
            function setresolutiony(response, next) {
                debug('/setresolution entering setdensity');
                /*gm(sampleFile)
                    .density(resolution, resolution)
                    .stream()
                    .pipe(res);*/
                gm(sampleFile)
                    .density(resolution, resolution)
                    .stream(function (err, stdout, stderr) {
                        if (err) {
                            next(err);
                        } else {
                            stdout.pipe(res)
                        }
                    });
            },

        ], function (err) {
            if (err) {
                console.error(
                    '/setresolution Unable to resize '
                );
            } else {
                console.log('/setresolution Successfully resized '  );

            }

            //  callback(null, "message");
        }
    );

});
app.post('/resize', async function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    const width = req.query.width ? parseInt(req.query.width) : SHARP_WIDTH;
    const height = req.query.height ? parseInt(req.query.height) : SHARP_HEIGHT;
    const fit = req.query.fit ? req.query.fit : SHARP_FIT; // contain keep ratio
    const format = req.query.format ? req.query.format : SHARP_FORMAT;
    const resolution = req.query.resolution ? parseInt(req.query.resolution) : SHARP_RESOLUTION;

    debug(`param width: ${width}`);debug(`param width: ${height}`);
    debug(`param fit: ${fit}`);debug(`param format:' ${format}`);

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile.data;
    // debug('/ process before req:' + JSON.stringify(metadata));
    response= {};

    async.waterfall([
            function intro(next) {
                debug('/setresolution entering waterfall');
                next(null, response);
            },
            function getFormat( response, next) {
            gm(sampleFile).format(function(err, format) {
                debug(`getFormat: ${format}`);
                if (err) {
                    next(err);
                } else {
                    res.set('Content-Type', `image/${format.toLowerCase()}`);
                    next(null,response);
                }

            });

        },
            function setresize(response, next) {
                debug('/resize entering setdensity');
                /*gm(sampleFile)
                    .density(resolution, resolution)
                    .stream()
                    .pipe(res);*/
                gm(sampleFile)
                    .resize(width, height)
                    .stream(function (err, stdout, stderr) {
                        if (err) {
                            next(err);
                        } else {
                            stdout.pipe(res)
                        }
                    });
            },
        ], function (err) {
            if (err) {
                console.error(
                    '/setresolution Unable to resize '
                );
            } else {
                console.log('/setresolution Successfully resized '  );

            }

            //  callback(null, "message");
        }
    );

});

app.post('/transform2', async function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    const width = req.query.width ? parseInt(req.query.width) : SHARP_WIDTH;
    const height = req.query.height ? parseInt(req.query.height) : SHARP_HEIGHT;
    const fit = req.query.fit ? req.query.fit : SHARP_FIT; // contain keep ratio
    const format = req.query.format ? req.query.format : SHARP_FORMAT;
    const resolution = req.query.resolution ? parseInt(req.query.resolution) : SHARP_RESOLUTION;

    debug(`param width: ${width}`);debug(`param width: ${height}`);
    debug(`param fit: ${fit}`);debug(`param format:' ${format}`);

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile.data;
    // debug('/ process before req:' + JSON.stringify(metadata));
    response= {};
    res.set('Content-Type', 'image/jpeg'); // set the header here
    async.waterfall([
            function intro(next) {
                debug('entering waterfall');
                next(null, sampleFile,resolution);
            },
            setdensity
            ,
            function resize(stream, next) {
                debug('entering resize');
                gm(stream)
                    .resize(500,500)
                    .stream(function (err, stdout, stderr) {
                        if (err) {
                            next(err);
                        } else {
                            stdout.pipe(res)
                        }
                    });
            }
        ], function (err) {
            if (err) {
                console.error(
                    'Unable to resize '
                );
            } else {
                console.log('Successfully resized '  );

            }

            //  callback(null, "message");
        }
    );

});
app.post('/transform2', async function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    const width = req.query.width ? parseInt(req.query.width) : SHARP_WIDTH;
    const height = req.query.height ? parseInt(req.query.height) : SHARP_HEIGHT;
    const fit = req.query.fit ? req.query.fit : SHARP_FIT; // contain keep ratio
    const format = req.query.format ? req.query.format : SHARP_FORMAT;
    const resolution = req.query.resolution ? parseInt(req.query.resolution) : SHARP_RESOLUTION;

    debug(`param width: ${width}`);debug(`param width: ${height}`);
    debug(`param fit: ${fit}`);debug(`param format:' ${format}`);

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile.data;
    // debug('/ process before req:' + JSON.stringify(metadata));
    response= {};
    res.set('Content-Type', 'image/jpeg'); // set the header here
    async.waterfall([
            function intro(next) {
                debug('entering waterfall');
                next(null, sampleFile,resolution);
            },
            setdensity
            ,
            function resize(stream, next) {
                debug('entering resize');
                gm(stream)
                    .resize(500,500)
                    .stream(function (err, stdout, stderr) {
                        if (err) {
                            next(err);
                        } else {
                            stdout.pipe(res)
                        }
                    });
            }
        ], function (err) {
            if (err) {
                console.error(
                    'Unable to resize '
                );
            } else {
                console.log('Successfully resized '  );

            }

            //  callback(null, "message");
        }
    );

});
app.post('/exemple', async function(req,res){
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    let sampleFile = req.files.sampleFile.data;
    async.waterfall([
            function download(next) {
                console.log('debug 0');
                // Download the image from S3 into a buffer.
                next(null,'dede');
            },
            function transform(response, next) {
                console.log('debug 1A');
                gm(sampleFile).size(function(err, size) {
                    console.log('debug 1B');
                    // Infer the scaling factor to avoid stretching the image unnaturally.
                    var scalingFactor = 1.2;
                    var width  = scalingFactor * size.width;
                    var height = scalingFactor * size.height;

                    // Transform the image buffer in memory.
                    this.resize(width, height)
                        .toBuffer( 'info.jpg', function(err, buffer) {
                            if (err) {
                                console.log('debug 1C- error');
                                next(err);
                            } else {
                                console.log('debug 1C - success');
                                next(null, response.ContentType, buffer);
                            }
                        });
                });
            },
            function upload(contentType, data, next) {
                // Stream the transformed image to a different S3 bucket.
                debug('debug 2');
                next(null);
            }
        ], function (err) {
            if (err) {
                console.error(
                    'Unable to resize '
                );
            } else {
                console.log('Successfully resized '  );
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send('end');
            }

            //  callback(null, "message");
        }
    );


});


function setdensity(sampleFile, resolution, next) {
    debug('entering setdensity');
    gm(sampleFile)
        .density(resolution, resolution)
        .toBuffer( function(err, buffer) {
            if (err) {
                next(err);
            } else {
                next(null,  buffer);
            }
        });
}

app.listen(PORT, function(){
    //debug(`listen port ${chalk.green(PORT)}`);
    console.log(`listening on port ${chalk.green(PORT)}`);
});

/*
size - returns the size (WxH) of the image
format - returns the image format (gif, jpeg, png, etc)
depth - returns the image color depth
color - returns the number of colors
res - returns the image resolution
filesize - returns image filesize
identify - returns all image data available
orientation - returns the EXIF orientation of the image*/
