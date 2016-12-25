"use strict";

// Constructor
var SKImageComparer = function (){
   var log4js = require('log4js');
   this.log = log4js.getLogger();

   this.imageDiff = require('image-diff');
   this.webshot = require('webshot');

   // Constants
   this.imgExt = '.png';
   this.actualImageDIR = 'actual_imgs';
   this.expectedImageDIR = 'expected_imgs';
   this.reportDir = 'report_dir';
};

SKImageComparer.prototype.Main = function() {
   // Parse CMD params
   var commander = require('commander');
   commander
   .version('0.0.1')
   .option( '--actualImages [type]', 'Actual images')
   .option( '--expectedImages [type]', 'Expected images')
   .option( '--actualImagesDir [type]', 'Actual images dir')
   .option( '--expectedImagesDir [type]', 'Expected images dir')
   .option( '--verbosity [level]', 'Set verbose level')
   .option( '--help', 'Display Help')
   .parse(process.argv);
   // TODO set log level as param

   // Figure out which function should be executed and run in
   if ( commander.actualImagesDir !== undefined 
        && commander.expectedImagesDir !== undefined
        && commander.actualImages !== undefined
        && commander.expectedImages !== undefined ) {
      
      this.actualURLs = this.getSiteURLsFromFile( commander.actualImages );
      this.expectedURLs = this.getSiteURLsFromFile( commander.expectedImages );
      this.DiffImages( commander.actualImagesDir, commander.expectedImagesDir );

   } else if ( commander.actualImages !== undefined
               && commander.actualImagesDir !== undefined) {
      var siteURLs = this.getSiteURLsFromFile( commander.actualImages );
      this.DownloadImages( siteURLs, commander.actualImagesDir );

   } else if ( commander.expectedImages !== undefined 
               && commander.expectedImagesDir !== undefined ) {
      var siteURLs = this.getSiteURLsFromFile( commander.expectedImages );
      this.DownloadImages( siteURLs, commander.expectedImagesDir );

   } else {
      this.log.fatal( 'You \'ve called this utility with bad parameters.' );
   }
}

// Download Image
SKImageComparer.prototype.DownloadImage = function( siteURL, outputName ) {
   if ( siteURL === '' || siteURL === null ) {
      this.log.error ( 'Empty or wrong input for URL: ', siteURL, 'skipping this URL');
      return;
   }

   this.webshot( siteURL, outputName, { shotSize: {height: "all", width: "all" } }, function(err) {
      if ( err !== null ) {
         this.log.error( 'Could not create screenshot for: ', siteURL, err );
         process.exit();
      }
   }.bind( this ));
}


// DownloadMultipleImages
SKImageComparer.prototype.DownloadImages = function ( siteURLs, outputDir ) {
   if ( siteURLs == null || outputDir == null ) {
      this.log.error( 'Wrong input!' );
      process.exit();
   }

   // Check if directory exists. Create if doesn't exist, die if it is empty
   var fs=require('fs');
   try {
     fs.accessSync( outputDir );
   } catch ( err ) {
      // Directory doesn't exist, should be created
      // TODO catch error
      fs.mkdirSync( outputDir );
   }

   // ValidaDirIsEmpty
   var files = fs.readdirSync( outputDir );
   if ( files.length > 0 ) {
      this.log.error('There are already some files in directory: ' + outputDir  + '. Exiting.');
      process.exit();
   }

   // Download Files
   for (var i = 0; i < siteURLs.length; i++ ) {
      var outputFile = outputDir + '/' + i + this.imgExt;
      this.log.debug( 'Downloading: ', siteURLs[i], ' to: ', outputFile );
      this.DownloadImage( siteURLs[i], outputFile );
   }
}

// Diff Image
SKImageComparer.prototype.DiffImage = function ( actualImg, expectedImg, diffImg ) {
   this.imageDiff.getFullResult({
      actualImage: actualImg,
      expectedImage: expectedImg,
      diffImage: diffImg,
   }, function (err, result) {
      if ( err !== null ) {
         this.log.error( 'Could not diff images: ', actualImg, ' and ', expectedImg, " error: ", err );
         process.exit();
      }
      if ( result.percentage > 0 ) {
         // Get the index in the array, should be in a function of it's own
         var filename = actualImg.split("/").pop();
         var r = /\d+/;
         var idx = filename.match(r);

         this.log.error('Screenshots from: ', this.actualURLs[idx], ' and ',this.expectedURLs[idx] , ' are different. actual image: '+ actualImg+ ' tested image: '+ expectedImg, ' diff image:' ); 
      }
      // TODO write total stat
   }.bind( this ));
}

SKImageComparer.prototype.DiffImages = function ( actualImgDir, expectedImgDir ) {
   // TODO check both dirs exist

   var actualFiles = this.getFilesInDir( actualImgDir );

   if ( actualFiles.length === 0 ) {
      this.log.error( 'Failed getting files from actualImgDir: ', actualImgDir );
      process.exit();
   }

   for (var file in actualFiles ) {
      this.DiffImage( actualImgDir+ '/' + file + this.imgExt, expectedImgDir + '/' + file + this.imgExt, expectedImgDir+ '/diff_' + file + this.imgExt );
   }
} 

SKImageComparer.prototype.getFilesInDir = function ( dir ) {
   var fs=require('fs');
   var files = fs.readdirSync( dir );
   return files; 
}

SKImageComparer.prototype.getSiteURLsFromFile = function ( filePath ) {
   var fs = require('fs');
   return fs.readFileSync( filePath ).toString().split("\n");
}


var app = new SKImageComparer();
app.Main();
