Firstly you must create the actual and expected images:

`node main.js --actualImages actual.txt  --actualImagesDir`

`node main.js --expectedImages actual.txt  --expectedImagesDir asd`

Then you can run the diff: 
`node main.js --actualImages actual.txt  --actualImagesDir asd1 --expectedImages actual.txt  --expectedImagesDir asd`
