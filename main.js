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

ImageComparer.prototype.Main = function() {
   this.ExecuteCommandFromCmdParams();
}

ImageComparer.prototype.GetCMDArgs = function () {
   var commander = require('commander');
   commander
   .version('0.0.1')
   .option( '--actualImages [type]', 'Actual images')
   .option( '--expectedImages [type]', 'Expected images')
   .option( '--actualImagesDir [type]', 'Actual images dir')
   .option( '--expectedImagesDir [type]', 'Expected images dir')
   .option( '--verbosity [level]', 'Set verbose level')
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

ImageComparer.prototype.ExecuteCommandFromCmdParams = function () {
   // Object containing the cmd parameters
   var cmdArgs = this.GetCMDArgs();

   if ( this.ShouldCompareScreenshots( cmdArgs ) ) {
      this.screenshotedURLs = this.getSiteURLsFromFile( cmdArgs.urlsFilePath );
      this.DiffImages( cmdArgs.originalScreenshotDir, cmdArgs.currentScreenshotDir );
   } else if ( this.ShouldTakeScreenshots( cmdArgs) ) {
      var siteURLs = this.getSiteURLsFromFile( cmdArgs.urlsFilePath );
      this.DownloadImages( siteURLs, cmdArgs.screenshotDir );
   } else {
      this.log.fatal( 'You \'ve called this utility with bad parameters.' );
   } 
}

ImageComparer.prototype.ShouldTakeScreenshots = function ( cmdArgs ) {
   return cmdArgs.screenshotDir !== undefined
          && cmdArgs.screenshotDir !== ''
          && cmdArgs.urlsFilePath !== undefined
          && cmdArgs.urlsFilePath !== '';
}

ImageComparer.prototype.ShouldCompareScreenshots = function ( cmdArgs ) {
   return cmdArgs.originalScreenshotDir !== undefined
          && cmdArgs.originalScreenshotDir !== ''
          && cmdArgs.currentScreenshotDir !== undefined
          && cmdArgs.currentScreenshotDir !== ''
          && cmdArgs.urlsFilePath !== undefined
          && cmdArgs.urlsFilePath !== '';
}

ImageComparer.prototype.getSiteURLsFromFile = function ( filePath ) {
   var fs = require('fs');
   var urls = fs.readFileSync( filePath )
               .toString()
               .split("\n");
   return urls;
}

ImageComparer.prototype.DiffImages = function ( originalScreenshotDir, currentScreenshotDir ) {
   // TODO check both dtirs exist
   var fileNames = this.getFileNamesInDir( originalScreenshotDir );
   for (var fileName in fileNames ) {
      this.DiffImage( this.GetFilePath( originalScreenshotDir, fileName ),
                      this.GetFilePath( currentScreenshotDir, fileName ) );
   }
} 

ImageComparer.prototype.getFileNamesInDir = function ( dirPath ) {
   var fs = require('fs');
   var filePaths = fs.readdirSync( dirPath );
   if ( filePaths.length === 0 ) {
      this.log.error( 'Failed getting files from dir: ', dirPath );
      process.exit();
   }
   return filePaths; 
}

ImageComparer.prototype.GetFilePath = function ( ScreenshotDir, fileName ) {
   return ScreenshotDir + '/' + fileName + this.imgExt;
}

ImageComparer.prototype.DiffImage = function ( originalImg, currentImg ) {
   this.imageDiff.getFullResult({
      actualImage: originalImg,
      expectedImage: currentImg,
   }, function (err, result) {
      if ( err !== null ) {
         this.log.error( 'Could not diff images: ', originalImg, ' and ', currentImg, " error: ", err );
         process.exit();
      }
      
      var ImagesAreDifferent = result.percentage > 0;
      if ( ImagesAreDifferent ) {
         this.log.error('Difference: ' + this.GetScreenshotSourceURL( originalImg ) + ' ' + originalImg + ' tested image: ' + currentImg + ' diff image:' ); 
      }
      // TODO write total stat
   }.bind( this ));
}

ImageComparer.prototype.GetScreenshotSourceURL = function ( originalImg ) {
   var filename = originalImg.split("/").pop();
   var r = /\d+/;
   var idx = filename.match(r);
   return this.screenshotedURLs[idx]
}

// DownloadMultipleImages
ImageComparer.prototype.DownloadImages = function ( siteURLs, outputDir ) {
   if ( siteURLs == null || outputDir == null ) {
      this.log.error( 'Wrong input!' );
      process.exit();
   }

   this.CreateDirIfNotExists();

   // If there are files, we shouldn't override them, end execution
   if ( this.DirHasFiles( outputDir ) ) {
      this.log.error('There are already some files in directory: ' + outputDir  + '. Exiting.');
      process.exit();
   }

   // Download Files
   for (var i = 0; i < siteURLs.length; i++ ) {
      this.DownloadImage( siteURLs[i], GetFilePath( outputDir, i ) );
   }
}

ImageComparer.prototype.CreateDirIfNotExists = function ( dirPath ) {
   var fs=require('fs');
   try {
      fs.accessSync( dirPath );
   } catch ( err ) {
      // Directory doesn't exist, should be created
      fs.mkdirSync( dirPath );
   }
} 

ImageComparer.prototype.DirHasFiles = function ( dirPath ) {
   var files = fs.readdirSync( dirPath );
   return files.length > 0;
}

ImageComparer.prototype.DownloadImage = function( siteURL, outputName ) {
   // Check arguments
   if ( siteURL === '' || siteURL === null ) {
      this.log.error ( 'Empty or wrong input for URL: ', siteURL, 'skipping this URL');
      return;
   }
   this.log.debug( 'Downloading: ', siteURLs[i], ' to: ', outputFile );

   // Download Image
   this.webshot( siteURL, outputName, { shotSize: {height: "all", width: "all" } }, function(err) {
      if ( err !== null ) {
         this.log.error( 'Could not create screenshot for: ', siteURL, err );
         process.exit();
      }
   }.bind( this ));
}

var app = new ImageComparer();
app.Main();
