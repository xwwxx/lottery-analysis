/**
 * Created by danielxiao on 15/9/2.
 */

var gulp = require('gulp');
var less = require('gulp-less');
var rename = require('gulp-rename');

gulp.task('less', function() {
  gulp.src('./style.less')
    .pipe(less())
    .pipe(rename({basename: 'bootstrap'}))
    .pipe(gulp.dest('./bower_components/bootstrap/dist/css'));
});

gulp.task('default', ['less']);
