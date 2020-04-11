
var express =require('express');
var chalk = require('chalk');
const fs = require('fs');
const debug = require('debug')('app');
var async = require('async');
var morgan = require('morgan');
http://aheckmann.github.io/gm/docs.html
gm = require('gm').subClass({imageMagick: true});

var app= express();

const fileUpload = require('express-fileupload');
const PORT = process.env.PORT || 4004;
const SHARP_FORMAT = process.env.SHARP_FORMAT || 'jpeg';
const SHARP_WIDTH = process.env.SHARP_WIDTH || null;
const SHARP_HEIGHT= process.env.SHARP_HEIGHT || null;
const SHARP_FIT= process.env.SHARP_FIT || 'contain';
const SHARP_RESOLUTION= process.env.SHARP_RESOLUTION || 266;

// middlewares operational
app.use('/not used',fileUpload());
app.use('/not used',(req,res,next)=>{
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    debug('middleware : you can insert some logs here');
    next();
});
app.use(morgan('tiny')); //combined (more verbose)

// endpooint Res API
app.get('/health', (req, res) => {
  res.sendStatus(200);
});
app.post('/info',fileUpload(), checkFile, async function(req,res){
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
app.post('/identity', fileUpload(), checkFile,async function(req,res){
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
app.post('/resize', fileUpload(), checkFile,async function(req, res) {
    req.my_params = {
        width : req.query.width ? parseInt(req.query.width) : null,
        height : req.query.height ? parseInt(req.query.height) : null,
        resolution : req.query.resolution ? parseInt(req.query.resolution) : null
};
   // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile.data;
    async.waterfall([
            function intro(next) {
                next(null, sampleFile, req,res);
            },
            layerFormat,
            layerResize,
            layerDensity,
            layerEnd
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

//for testing purpose
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
app.post('/exemple3', async function(req, res) {
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
app.post('/exemple2', async function(req, res) {
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

// middlewares appications

function checkFile(req,res,next){
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    next();
}
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
function layerFormat( sampleFile, req, res, next) {
    debug('/apply layerFormat ');
    gm(sampleFile).format(function (err, format) {
        //debug(`getFormat: ${format}`);
        if (err) {next(err);} else {
            res.set('Content-Type', `image/${format.toLowerCase()}`);
            next(null, sampleFile, req, res);
        }

    });
}
function layerResize(sampleFile, req, res, next) {
    debug(`/layerResize with values width ${req.my_params.width} height ${req.my_params.height}`);
    if( !req.my_params.width && !req.my_params.height) {
        debug(`/layerResize skipped`);
        next(null, sampleFile, req, res);
    }
    else{
        debug(`/layerResize apply`);
        gm(sampleFile)
            .resize(req.my_params.width, req.my_params.height)
            .toBuffer(  function(err, buffer) {
                if (err) {next(err);} else {next(null, buffer, req, res);}
            });
    }

}
function layerDensity(sampleFile, req, res, next) {
    debug(`/apply layerDensity values resolution ${req.my_params.resolution}`);
    if(!req.my_params.resolution)
            next(null, sampleFile, req, res);
    else {
        gm(sampleFile)
            .density(req.my_params.resolution, req.my_params.resolution)
            .toBuffer(function (err, buffer) {
                if (err) {
                    next(err);
                } else {
                    next(null, buffer, req, res);
                }
            });
    }
}
function layerEnd(sampleFile, req, res, next) {
    debug(`/layerEnd`);
    gm(sampleFile)
        .stream(function (err, stdout, stderr) {
            if (err) {
                next(err);
            } else {
                stdout.pipe(res)
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
