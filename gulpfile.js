//LATH VARIABLE

let projectFolder = 'dist';
let sourceFolder = 'src';

let {
    src,
    dest,
    parallel,
    series
} = require('gulp');
let gulp = require('gulp');
let del = require('del');

let browserSync = require('browser-sync').create();
let fileInclude = require('gulp-file-include');
let scss = require('gulp-sass');
let autoprefixer = require('gulp-autoprefixer');
let groupMedia = require('gulp-group-css-media-queries');
let cleanCss = require('gulp-clean-css');
let rename = require('gulp-rename');
let plumber = require("gulp-plumber");
let sourcemaps = require('gulp-sourcemaps');
let cssbeautify = require('gulp-cssbeautify');
let notify = require('gulp-notify');
let removeComments = require('gulp-strip-css-comments');
let uglify = require("gulp-uglify");
let imagemin = require('gulp-imagemin');
let webp = require('gulp-webp');
let webpHTML = require('gulp-webp-html');
let webpCSS = require('gulp-webp-css');
let ttf2woff = require('gulp-ttf2woff');
let ttf2woff2 = require('gulp-ttf2woff2');
let fonter = require('gulp-fonter');
let fs = require('fs');

//PATH

const path = {
    build: {
        html: `${projectFolder}/`,
        js: `${projectFolder}/assets/js/`,
        css: `${projectFolder}/assets/css/`,
        img: `${projectFolder}/assets/img/`,
        fonts: `${projectFolder}/assets/fonts/`
    },
    src: {
        html: [`${sourceFolder}/**/*.html`, `!${sourceFolder}/**/_*.html`],
        js: [`${sourceFolder}/assets/js/**/*.js`,
            `!${sourceFolder}/assets/js/**/_*.js`
        ],
        css: `${sourceFolder}/assets/scss/style.scss`,
        img: `${sourceFolder}/assets/img/**/*.{jpg,png,svg,gif,ico,webp}`,
        fonts: `${sourceFolder}/assets/fonts/*.{ttf,woff,woff2}`
    },
    watch: {
        html: `${sourceFolder}/**/*.html`,
        js: `${sourceFolder}/assets/js/**/*.js`,
        css: `${sourceFolder}/assets/scss/**/*.scss`,
        img: `${sourceFolder}/assets/img/**/*.{jpg,png,svg,gif,ico,webp}`
    },
    clean: `./${projectFolder}/`
};


// Browser Sync

function browserInit(params) {
    browserSync.init({
        server: {
            baseDir: `./${projectFolder}/`,
        },
        port: 3000,
        notify: false,
    });
}

function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

// HTML

function html() {
    return src(path.src.html)
        .pipe(fileInclude())
        .pipe(webpHTML())
        .pipe(dest(path.build.html))
        .pipe(browserSync.stream());
}

//CSS

function css() {
    return src(path.src.css)
        .pipe(plumber({
            errorHandler: notify.onError((err) => ({
                title: 'Styles',
                sound: false,
                message: err.message,
            }))
        }))
        .pipe(webpCSS())
        .pipe(sourcemaps.init())
        .pipe(scss({
            outputStyle: 'expanded',
        }))
        .pipe(groupMedia())
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 8 versions'],
                cascade: true,
            })
        )
        .pipe(cssbeautify())
        .pipe(sourcemaps.write())
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream())
        .pipe(removeComments())
        .pipe(cleanCss())
        .pipe(rename({
            suffix: ".min",
            extname: ".css"
        }))
        .pipe(dest(path.build.css));
}

//JAVA SCRIPT

function js() {
    return src(path.src.js)
        .pipe(fileInclude())
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream())
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min",
            extname: ".js"
        }))
        .pipe(dest(path.build.js));
}

//IMAGES 

function images() {
    return src(path.src.img)
        .pipe(webp({
            quality: 70
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            interlaced: true,
            optimizationLevel: 3 // 0 - 7
        }))
        .pipe(dest(path.build.img))
        .pipe(browserSync.stream());
}

//FONTS

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(`src/assets/fonts/`));
   return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(`src/assets/fonts/`)); 
}

function dispatchFonts() {
   return src(path.src.fonts)
        .pipe(dest(path.build.fonts)); 
}

gulp.task('otf2ttf', function () {

    return src([`${sourceFolder}/fonts/*.otf`])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(`${sourceFolder}/fonts/`));
});

// function for fonts


function calback() {}
function fontsStyle(calback) {
    let fileContent = fs.readFileSync(`${sourceFolder}/assets/scss/fonts.scss`);
    if (fileContent == '') {
      fs.writeFile(`${sourceFolder}/assets/scss/fonts.scss`, '', calback);
      return fs.readdir(`${sourceFolder}/assets/fonts/`, 
        function (err, items) {
        if (items) {
          let cFontname;
          for (var i = 0; i < items.length; i++) {
            let fontname = items[i].split('.');
            fontname = fontname[0];
            if (cFontname != fontname) {
              fs.appendFile(`${sourceFolder}/assets/scss/fonts.scss`,
            `@include font("${fontname}", "${fontname}", "400", "normal");
`, calback);
            }
            cFontname = fontname;
          }
        }
      });
    }
  }


//Clean Build 

function clean() {
    return del(path.clean);
}

let font = gulp.series(fonts, fontsStyle);
let build = gulp.series(clean, 
    gulp.parallel(js, css, html, images, dispatchFonts));
let watch = gulp.parallel(build, watchFiles, browserInit);




// EXPORTS

exports.dispatchFonts = dispatchFonts;
exports.font = font;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.watchFiles = watchFiles;
exports.clean = clean;
exports.build = build;
exports.html = html;
exports.watch = watch;
exports.default = watch;

