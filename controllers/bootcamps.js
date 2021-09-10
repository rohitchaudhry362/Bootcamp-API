const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const geocoder = require('../utils/geocoder');
const path = require('path');

// @desc     Get all Bootcamps
// @router   GET /api/v1/bootcamps
// @access   Public

exports.getBootcamps = asyncHandler(async (req, res, next) => {

        res.status(200).json(res.advancedResults);
});

// @desc     Get single Bootcamp
// @router   GET /api/v1/bootcamps/:id
// @access   Public

exports.getBootcamp = asyncHandler(async (req, res, next) => {
        const bootcamp = await Bootcamp.findById(req.params.id);

        if(!bootcamp){
            return next(
                new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404)
                );
        }
        res.status(200).json({ 
            success: true,
            data: bootcamp
        });
});

// @desc     Create new Bootcamp
// @router   POST /api/v1/bootcamps
// @access   Private

exports.createBootcamp = asyncHandler(async (req, res, next) => {

        // Add user to request Body
        req.body.user = req.user.id;

        // Check for published bootcamps
        const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

        // If the user is not in admin, they can only add one Bootcamp
        if(publishedBootcamp && req.user.role !== 'admin'){
            return next(
                new ErrorResponse
                (`The user with ID ${req.user.id} has already published a bootcamp`,
                 400)
                 );
        }

        const bootcamp = await Bootcamp.create(req.body);

        res.status(201).json({ 
        success: true,
        data: bootcamp
        });
});

// @desc     Update Bootcamp
// @router   PUT /api/v1/bootcamps/:id
// @access   Private

exports.updateBootcamp = asyncHandler(async (req, res, next) => {
        let bootcamp = await Bootcamp.findById(req.params.id);
   
       if(!bootcamp){
            return next(
                new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404)
            );
       }

       // Make sure user is bootcamp owner
       if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') 
       {
            return next(
                new ErrorResponse(`user ${req.params.id} is not authorized to update this bootcamp`,
                 401));
       }

       bootcamp = await Bootcamp.findOneAndUpdate(req.params.id,
        req.body,
        { new: true, runValidators: true });

       res.status(200).json({ 
           success: true,
           data: bootcamp
        });
});

// @desc     Delete Bootcamp
// @router   DELETE /api/v1/bootcamps/:id
// @access   Private

exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
        const bootcamp = await Bootcamp.findById(req.params.id);
   
       if(!bootcamp){
            return next(
                new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404)
            );
       }

        // Make sure user is bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') 
        {
             return next(
                 new ErrorResponse(`user ${req.params.id} is not authorized to delete this bootcamp`,
                  401));
        }

       bootcamp.remove();

       res.status(200).json({ 
           success: true,
           data: {}
        });
});  

// @desc     Get Bootcamps within a radius
// @router   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access   Private

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const {zipcode , distance } = req.params;

    // Get lan/lang from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius = 3,963 mi / 6,378 km
    const radius = distance / 3963; 
    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: { $centerSphere: [[ lng, lat ], radius] }
        }
    });
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    });
});  

// @desc     upload photo for the bootcamp
// @router   PUT /api/v1/bootcamps/:id/photo
// @access   Private

exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

   if(!bootcamp){
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404)
        );
   }

   // Make sure user is bootcamp owner
   if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') 
   {
        return next(
            new ErrorResponse(`user ${req.params.id} is not authorized to update this bootcamp`,
             401));
   }

   if(!req.files) {
       return next(new ErrorResponse(`Please upload a file`,400));
   }

   const file = req.files.file;

   // Make sure the image is photo 
   if(!file.mimetype.startsWith('image')){
        return next(new ErrorResponse(`Please upload an image file`,400));
   }

   // Check file size
   if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(
            new ErrorResponse(`Please upload an image less than 
            ${process.env.MAX_FILE_UPLOAD}`, 400));      
   }

   // Create custome file name
   file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

   file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
        if(err){
            console.log(err);
            return next(
                new ErrorResponse(
                    `Problem with file upload`,500)
            );
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, {photo: file.name });
        res.status(200).json({
            success: true,
            data: file.name
        })
   });
});  
