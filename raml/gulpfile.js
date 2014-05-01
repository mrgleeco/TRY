
var gulp = require('gulp');
var raml = require('gulp-raml');

gulp.task('raml', function() {
  gulp.src('./spec/*.raml')
    .pipe(raml())
    .pipe(raml.reporter('default'))
     .pipe(raml.reporter('fail'));
});
