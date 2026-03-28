import {src, dest, series, watch} from 'gulp'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
import browserSync from 'browser-sync'

const server = browserSync.create()

const sass = gulpSass(dartSass)

export function html(done) {
    src('*.html')
    .pipe(dest('build'))
    done()
}

export function js(done) {
    src('src/js/app.js')
        .pipe(dest('build/js'))
    done()
}

export function css(done) {
    src('src/scss/app.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(dest('build/css'))
    done()
}

export function images(done) {
    src('src/img/**/*')
        .pipe(dest('build/img'))
    done()
}

export function dev() {
    server.init({
        server: {
            baseDir: 'build'
        },
        port: 3000,
        open: true
    })

    watch('src/scss/**/*.scss', css).on('change', server.reload)
    watch('src/js/**/*.js', js).on('change', server.reload)
    watch('*.html', html).on('change', server.reload)
}

export const devBuild = series(html, js, css, images, dev)
export const build = series(html, js, css, images)
export default build