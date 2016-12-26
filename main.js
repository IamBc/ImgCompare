"use strict";

// Constructor
var ImageComparer = function (){
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

ImageComparer.prototype.main = function() {
   this.executeCommandFromCmdArgs();
}

ImageComparer.prototype.executeCommandFromCmdArgs = function () {
   // Object containing the cmd parameters
   var cmdArgs = this.getCMDArgs();

   var siteURLs = this.getSiteURLsFromFile( cmdArgs.urlsFilePath );
   if ( this.shouldcompareScreenshots( cmdArgs ) ) {
      this.screenshotedURLs = siteURLs; // Used for detailed logging
      this.compareScreenshots( cmdArgs.originalScreenshotDir, cmdArgs.currentScreenshotDir );
   } else if ( this.shouldTakeScreenshots( cmdArgs) ) {
      this.screenshotSites( siteURLs, cmdArgs.screenshotDir );
   } else {
      this.log.fatal( 'You \'ve called this utility with bad parameters.' );
   } 
}

ImageComparer.prototype.getCMDArgs = function () {
   var commander = require('commander');
   commander
   .version('0.0.1')
   .option( '--help [type]', 'Display Help')
   .option( '--urlsFilePath [type]', 'Display Help')
   .option( '--screenshotDir [type]', 'Display Help')
   .option( '--urlsFilePath [type]', 'Display Help')
   .option( '--currentScreenshotDir [type]', 'Display Help')
   .option( '--originalScreenshotDir [type]', 'Display Help')
   .parse(process.argv);

   // can be accessed as properties with the same name minus --
   // eg --foo is cmdArgs.foo
   return commander;
}

ImageComparer.prototype.getSiteURLsFromFile = function ( filePath ) {
   var fs = require('fs');
   var siteURLs = fs.readFileSync( filePath )
                     .toString()
                     .split("\n");
   if ( siteURLs.length === 0 ) {
      this.log.error( 'Failed getting files from dir: ', filePath );
      process.exit();
   }
   return siteURLs;
}

ImageComparer.prototype.shouldTakeScreenshots = function ( cmdArgs ) {
   return cmdArgs.screenshotDir !== undefined
          && cmdArgs.screenshotDir !== ''
          && cmdArgs.urlsFilePath !== undefined
          && cmdArgs.urlsFilePath !== '';
}

ImageComparer.prototype.shouldcompareScreenshots = function ( cmdArgs ) {
   return cmdArgs.originalScreenshotDir !== undefined
          && cmdArgs.originalScreenshotDir !== ''
          && cmdArgs.currentScreenshotDir !== undefined
          && cmdArgs.currentScreenshotDir !== ''
          && cmdArgs.urlsFilePath !== undefined
          && cmdArgs.urlsFilePath !== '';
}

ImageComparer.prototype.compareScreenshots = function ( originalScreenshotDir, currentScreenshotDir ) {
   this.assertDirExists( originalScreenshotDir );
   this.assertDirExists( currentScreenshotDir );

   var fileNames = this.getFileNamesFromDir( originalScreenshotDir );
   for (var i = 0; i < fileNames.length; i++ ) {
      this.compareScreenshot( this.getFilePath( originalScreenshotDir, fileNames[i] ),
                              this.getFilePath( currentScreenshotDir, fileNames[i] ) );
   }
} 

ImageComparer.prototype.assertDirExists = function ( dirPath ) {
   try {
      var fs = require('fs');
      fs.accessSync( dirPath );
   } catch ( err ) {
      this.log.error( ' Could not access dir: ' + dirPath );
      throw err;
   }
}

ImageComparer.prototype.getFileNamesFromDir = function ( dirPath ) {
   var fs = require('fs');
   var filePaths = fs.readdirSync( dirPath );
   if ( filePaths.length === 0 ) {
      this.log.error( 'Failed getting files from dir: ', dirPath );
      process.exit();
   }
   return filePaths; 
}

ImageComparer.prototype.getFilePath = function ( screenshotDir, fileName ) {
   return screenshotDir + '/' + fileName;
}

ImageComparer.prototype.compareScreenshot = function ( originalImgPath, currentImgPath ) {
   this.imageDiff.getFullResult({
      actualImage: originalImgPath,
      expectedImage: currentImgPath,
   }, function (err, result) {
      if ( err !== null ) {
         this.log.error( 'Could not diff images: ', originalImgPath, ' and ', currentImgPath, " error: ", err );
         process.exit();
      }
      
      var ImagesAreDifferent = result.percentage > 0;
      if ( ImagesAreDifferent ) {
         this.log.error( 'Difference: ' + this.getScreenshoutSourceURL( originalImgPath ) + ' '
                         + originalImgPath + ' tested image: ' + currentImgPath + ' diff image:' ); 
      }
   }.bind( this ));
}

ImageComparer.prototype.getScreenshoutSourceURL = function ( originalImgPath ) {
   var filename = originalImgPath.split("/").pop();
   var r = /\d+/;
   var idx = filename.match(r);
   return this.screenshotedURLs[idx]
}

ImageComparer.prototype.screenshotSites = function ( siteURLs, outputDir ) {
   this.createDirIfNotExists( outputDir );

   // If there are files, we shouldn't override them, end execution
   if ( this.dirHasFiles( outputDir ) ) {
      this.log.error('There are already some files in directory: ' + outputDir  + '. Exiting.');
      process.exit();
   }

   for (var i = 0; i < siteURLs.length; i++ ) {
      this.screenshotSite( siteURLs[i],
                           this.getFilePath( outputDir, this.generateScreenshotFileName(i) ) );
   }
}

ImageComparer.prototype.generateScreenshotFileName = function ( baseName ) {
   return baseName + this.imgExt;
}

ImageComparer.prototype.createDirIfNotExists = function ( dirPath ) {
   var fs = require('fs');
   try {
      this.assertDirExists( dirPath );
   } catch ( err ) {
      // Directory doesn't exist, should be created
      fs.mkdirSync( dirPath );
   }
}

ImageComparer.prototype.dirHasFiles = function ( dirPath ) {
   var fs = require('fs');
   var files = fs.readdirSync( dirPath );
   return files.length > 0;
}

ImageComparer.prototype.screenshotSite = function( siteURL, outputFileName ) {
   // Check arguments
   if ( siteURL === '' || siteURL === null ) {
      this.log.error ( 'Empty or wrong input for URL: ', siteURL, 'skipping this URL');
      return;
   }
   this.log.debug( 'Creating screenshot: ', siteURL, ' to: ', outputFileName );

   // Create the screenshot
   this.webshot( siteURL, outputFileName, { shotSize: {height: "all", width: "all" } }, function(err) {
      if ( err !== null ) {
         this.log.error( 'Could not create screenshot for: ', siteURL, err );
         process.exit();
      }
   }.bind( this ));
}

var app = new ImageComparer();
app.main();
