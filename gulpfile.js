var argv = require('minimist')(process.argv.slice(2));
var concat = require('gulp-concat');
var gulp = require('gulp');
var gulpif = require('gulp-if');

// Is the current build running on travis?
var onTravis = !!process.env.TRAVIS;

// The paths
var paths = {
  src: {
    cs: {
      scss: 'src/css/cs/**/*.scss',
      js: './src/js/cs/main.js'
    },
    loadFiles: './src/js/loadfiles/**/*.js'
  },
  dist: {
    main: 'dist',
    images: 'dist/uc_images'
  }
};

// The file names
var names = {
  dist: {
    css: 'sis_cs.css',
    js: 'sis_cs.js',
    loadFiles: 'sis_loadfiles.js'
  }
};

/**
 * CSS Task
 *  - autoprefix
 *  - contact
 *  - sassify
 */
gulp.task('css', function() {
  // Automatically add browser prefixes (e.g. -webkit) when necessary
  var autoprefixer = require('gulp-autoprefixer');
  // Convert the .scss files into .css
  var sass = require('gulp-sass');

  return gulp.src(paths.src.cs.scss)
    .pipe(sass())
    .pipe(autoprefixer({
      cascade: false
    }))
    // Combine the files
    .pipe(concat(names.dist.css))
    // Output to the correct directory
    .pipe(gulp.dest(paths.dist.main));
});

/**
 * Run the CSS Linter on the CSS files
 */
gulp.task('css-lint', function() {
  var scsslint = require('gulp-scss-lint');

  return gulp.src(paths.src.cs.scss)
    .pipe(scsslint())
    // Only fail the build when running on Travis
    .pipe(gulpif(onTravis, scsslint.failReporter()));
});

gulp.task('load-files', function() {
  var uglify = require('gulp-uglify');

  return gulp.src(paths.src.loadFiles)
    // Combine the files
    .pipe(concat(names.dist.loadFiles))
    // Minify the file
    .pipe(uglify())
    // Output to the correct directory
    .pipe(gulp.dest(paths.dist.main));
});

// Setup the JavaScript task
var gutil = require('gulp-util');
var browserify = require('browserify');
var watchify = require('watchify');
var bundler = browserify({
  entries: paths.src.cs.js,
  transform: 'brfs'
});

// Only watch when needed
if (argv.watch) {
  var watcher  = watchify(bundler);
  watcher.on('update', bundleJs);
  watcher.on('log', gutil.log);
}

/**
 * Bundle the JavaScript
 */
function bundleJs() {
  var source = require('vinyl-source-stream');

  return bundler.bundle()
    // Log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    // Name the output file
    .pipe(source(names.dist.js))
    // Output to the correct directory
    .pipe(gulp.dest(paths.dist.main));
};

gulp.task('js', bundleJs);

/**
 * Build Clean task
 * Remove all the files generated by the build
 */
gulp.task('build-clean', function(callback) {
  var del = require('del');
  del(
    [
      paths.dist.main
    ], callback);
});

gulp.task('lint', ['css-lint']);

gulp.task('build', ['css', 'js', 'load-files']);

if (argv.watch) {
  gulp.watch(paths.src.cs.scss, ['css']);
  gulp.watch(paths.src.loadFiles, ['load-files']);
}

gulp.task('default', ['build-clean', 'build']);
gulp.task('prod', ['build-clean', 'build', 'lint']);
