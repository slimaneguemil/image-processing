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

//middleware
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
        debug(`/layerResize applied`);
        gm(sampleFile)
            .resize(req.my_params.width, req.my_params.height)
            .toBuffer(  function(err, buffer) {
                if (err) {next(err);} else {next(null, buffer, req, res);}
            });
    }

}
function layerDensity(sampleFile, req, res, next) {
    debug(`/layerDensity values resolution ${req.my_params.resolution}`);
    if(!req.my_params.resolution) {
        debug('/layerDensity skipped');
        next(null, sampleFile, req, res);
    }
    else {
        debug('/layerDensity applied');
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

app.listen(PORT, function(){
    //debug(`listen port ${chalk.green(PORT)}`);
    console.log(`listening on port ${chalk.green(PORT)}`);
});
