//https://www.npmjs.com/package/express-fileupload
//https://www.google.com/search?q=postman+post+multi-part&oq=postman+post+multi-part&aqs=chrome..69i57j33.7538j0j7&sourceid=chrome&ie=UTF-8#kpvalbx=_yFmMXsOqNMyRlwT9morgCA28
// with postman create a post request wit form-data
// create a key/value samplefile/file
//https://www.npmjs.com/package/probe-image-size
//https://sharp.pixelplumbing.com/api-resize
var express =require('express');
var chalk = require('chalk');
const fs = require('fs');
const sharp = require('sharp');
const debug = require('debug')('app');
//var childProcessPromise = require('./child-process-promise');
var app= express();
var probe = require('probe-image-size');

const fileUpload = require('express-fileupload');
const PORT = process.env.PORT || 4002;
const SHARP_FORMAT = process.env.SHARP_FORMAT || 'jpeg';
const SHARP_WIDTH = process.env.SHARP_WIDTH || null;
const SHARP_HEIGHT= process.env.SHARP_HEIGHT || null;
const SHARP_FIT= process.env.SHARP_FIT || 'contain';
const SHARP_RESOLUTION= process.env.SHARP_RESOLUTION || 266;
const MINPRINTSIZE = 3
const MAXPRINTSIZE = 3

// default options
app.use(fileUpload());
// ex: http://localhost:4002/upload?height=300&width=300&fit=cover&format=tiff
// ex: http://localhost:4002/upload?height=300&width=300&fit=cover&format=jpeg
app.post('/upload', function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    const width = req.query.width ? parseInt(req.query.width) : SHARP_WIDTH;
    const height = req.query.height ? parseInt(req.query.height) : SHARP_HEIGHT;
    const fit = req.query.fit ? req.query.fit : SHARP_FIT; // contain keep ratio
    const format = req.query.format ? req.query.format : SHARP_FORMAT;
    const resolution = req.query.resolution ? parseInt(req.query.resolution) : SHARP_RESOLUTION;

    debug(`param width: ${width}`);
    debug(`param width: ${height}`);
    debug(`param fit: ${fit}`);
    debug(`param format:' ${format}`);

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile.data;
    debug('before resizing');
    debug(probe.sync(sampleFile));
    resizeIn(sampleFile,width,height,fit,format,resolution).pipe(res);
});
app.post('/transform', async function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    const width = req.query.width ? parseInt(req.query.width) : SHARP_WIDTH;
    const height = req.query.height ? parseInt(req.query.height) : SHARP_HEIGHT;
    const fit = req.query.fit ? req.query.fit : SHARP_FIT; // contain keep ratio
    const format = req.query.format ? req.query.format : SHARP_FORMAT;
    const resolution = req.query.resolution ? parseInt(req.query.resolution) : SHARP_RESOLUTION;

    debug(`param width: ${width}`);
    debug(`param width: ${height}`);
    debug(`param fit: ${fit}`);
    debug(`param format:' ${format}`);

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile.data;
   // debug('/ process before req:' + JSON.stringify(metadata));
    try {
        t = await transform(sampleFile, width, height, fit, format, resolution);
        t.pipe(res);
    }catch (e) {
        debug('error calling trnsform');
        res.status(401).send("Error processing image calculation");
    }
});

app.post('/info', async function(req,res){
    if (!req.files || Object.keys(req.files).length === 0) {
        debug('No files were uploaded.');
        return res.status(400).send('No files were uploaded.');
    }
    let sampleFile = req.files.sampleFile.data;
    try {
        metadata = await getMetadata(sampleFile)
        debug('before req:' + JSON.stringify(metadata));
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(metadata));
    }catch (e) {
        debug('error calling getMetadata');
        res.status(401).send("Error processing image calculation");
    }
});

function resizeIn(sampleFile,width,height,fit,format,resolution){
    resolution= resolution/25.4;  //dpi/inch to dpi/mm
    let resize=   sharp(sampleFile)
        //.metadata()
        .resize({
            width: width,
            height: height,
            fit: fit,
        });

    switch (format) {
        case 'jpeg':
            debug(`resize format jpeg`);
            return resize.withMetadata()
             /*   .tiff({
                    xres: resolution, // pixel/mm
                    yres:resolution   //pixel/mm
                })*/
                .jpeg();

            break;
        case 'tiff':

            debug(`resize format tiff with resolution: ${resolution}`)
            return resize.tiff({
                xres: resolution, // pixel/mm
                yres:resolution   //pixel/mm
            });
            break;
        default:
            debug(`resize other format`);
            return resize.withMetadata();

    }

}

function transform(sampleFile,width,height,fit,format,resolution){
debug('/transform resolution:'+ resolution);
resolution= resolution/25.4;  //dpi/inch to dpi/mm
 const pxMin = Math.round((3.5 * 266)/2.54);
 const pxMax = Math.round(( 8* 266)/2.54);
 debug(`/transform pxMin:${pxMin} pxMax:${pxMax}`);

 var pxImage= null;
 var pyImage= null;

 var resize=   sharp(sampleFile);
    return resize
        .metadata()
        .then(function(metadata) {
            debug('/ transform metadata:' + JSON.stringify(metadata));
            pxImage = metadata.width;
            pyImage = metadata.height;
            var options= {};
            options = checkMinPrintSize (metadata);
            debug('/ transform options:' + JSON.stringify(options));
            return sharp(sampleFile)
                .resize(
                    options
                )
                .toBuffer()
        })
        .then(function(data){
            debug('/ transform options:'+ JSON.stringify(options));
            return sharp(data)
                .tiff({
                    xres: resolution, // pixel/mm
                    yres:resolution   //pixel/mm
                });
        }
 );

}


function checkMinPrintSize (metadata){
    option ={};
    sizeXcm = (metadata.width / metadata.density) * 2.54;
    sizeYcm = (metadata.height/ metadata.density) * 2.54;
    ratio = 1;

    if (sizeXcm < MINPRINTSIZE && sizeYcm < MINPRINTSIZE){
        debug("3 MIN PRINT SIZE error : Expected min print size  (" + MINPRINTSIZE + "x" + MINPRINTSIZE + ")cm" );
        if (sizeXcm > sizeYcm){
            ratio= (MINPRINTSIZE / sizeXcm) + 0.5;
        } else {
            ratio = (MINPRINTSIZE / sizeYcm) + 0.5;
        }
        option= {
            width : metadata.width * ratio,
            height: metadata.height * ratio
        };
    }
    return option;
}

function getMetadata(sampleFile){
    const image = sharp(sampleFile);
    return  image
        .metadata()
        .then(function(metadata) {
            debug('getMetadat:' + JSON.stringify(metadata));
            return {
                format: metadata.format,
                size: metadata.size,
                width: metadata.width,
                height: metadata.height,
                dpi: metadata.density,
                 xcm: (metadata.width/metadata.density)*2.54,
                 ycm: (metadata.height/metadata.density)*2.54
            };
        });
}

app.listen(PORT, function(){
    //debug(`listen port ${chalk.green(PORT)}`);
    console.log(`listening on port ${chalk.green(PORT)}`);
});