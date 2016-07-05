
var gulp = require('gulp');
var debug = require('gulp-debug');
var raml = require('gulp-raml');

gulp.task('raml', function() {
  gulp.src('./spec/*.raml')
    .pipe(raml())
    .pipe(raml.reporter('default'))
    // .pipe(debug())
    .pipe( raml.on('data', function(newFile){ console.log('inside')}))
     .pipe(raml.reporter('fail'));
});
