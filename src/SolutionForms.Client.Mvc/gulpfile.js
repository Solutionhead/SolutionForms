/// <binding AfterBuild='copy' Clean='clean' />
"use strict";

var gulp = require("gulp"),
    rimraf = require("rimraf"),
    concat = require("gulp-concat"),
    cssmin = require("gulp-cssmin"),
    uglify = require("gulp-uglify");

var paths = {
    webroot: "./wwwroot/",
    bower_mods: './bower_modules/'
};

paths.js = paths.webroot + "js/**/*.js";
paths.minJs = paths.webroot + "js/**/*.min.js";
paths.css = paths.webroot + "css/**/*.css";
paths.minCss = paths.webroot + "css/**/*.min.css";
paths.concatJsDest = paths.webroot + "js/site.min.js";
paths.concatCssDest = paths.webroot + "css/site.min.css";
paths.bootstrap = paths.bower_mods + 'bootstrap/dist/';

gulp.task("clean:js", function (cb) {
    rimraf(paths.concatJsDest, cb);
});

gulp.task("clean:css", function (cb) {
    rimraf(paths.concatCssDest, cb);
});

gulp.task("clean", ["clean:js", "clean:css"]);

gulp.task("min:css", function () {
    return gulp.src([paths.css, "!" + paths.minCss])
        .pipe(concat(paths.concatCssDest))
        .pipe(cssmin())
        .pipe(gulp.dest("."));
});

gulp.task("copy-modules:js-to-wwwroot", function() {
  gulp.src(paths.bower_mods + 'jquery-validation/dist/jquery.validate.js')
    .pipe(uglify())
    .pipe(gulp.dest(paths.webroot + 'js/lib'));
});

gulp.task('copy-modules:css-to-wwwroot', function () {
    gulp.src(paths.bower_mods + 'jquery-ui/themes/base/all.css')
        .pipe(concat(paths.webroot + 'css/jquery-ui-all.min.css'))
        .pipe(cssmin())
        .pipe(gulp.dest("."));
        
    return gulp.src([
            paths.bootstrap + 'css/bootstrap.css', paths.bootstrap + 'css/bootstrap.min.css', paths.bootstrap + 'css/bootstrap.css.map',
            paths.bower_mods + 'font-awesome/css/font-awesome.css', paths.bower_mods + 'font-awesome/css/font-awesome.min.css', paths.bower_mods + 'font-awesome/css/font-awesome.css.map'
        ])
        .pipe(gulp.dest(paths.webroot + 'css/'));
});

gulp.task("copy", ["copy-modules:css-to-wwwroot", "copy-modules:js-to-wwwroot"]);

gulp.task("min", ["min:css"]);
