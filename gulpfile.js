const gulp = require('gulp')
const { src, dest, series, parallel, watch } = require('gulp')
const { lastRun } = require('gulp')
const sass = require('gulp-sass')(require('node-sass'))
const rename = require('gulp-rename')
const { exec } = require('child_process')

//tsのコンパイルはtsc -wに任せるのでtsconfigを参照

const myPrefix = 'PH_'

const paths = {
  //scssをcompiled/cssへ
  scss: {
    watch: './resources/**/*.scss',
    func: buildCSS,
    replacePattern: /resources/,
    newStr: 'compiled',
  },
  //public/**/*.cssが変更されたら publish/cssへコピー
  publicCSS: {
    watch: './compiled/public/**/*.css',
    func: copyCSS,
    replacePattern: /compiled\\public/,
    newStr: 'publish',
  },
  publicJs: {
    watch: ['./compiled/public/**/*.js', './resources/public/**/*.meta'],
    func: generatePublish,
  },
}
function watchTS(done) {
  exec('tsc -w')
  done()
}

function buildCSS(path) {
  console.log(`change scss ${path}`)
  const currentPath = paths.scss
  console.log(path.replace(currentPath.replacePattern, currentPath.newStr))
  return gulp
    .src(path)
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(
      rename(
        (path) =>
          (path.dirname = path.dirname.replace(
            currentPath.replacePattern,
            currentPath.newStr
          ))
      )
    )
    .pipe(dest('./'))
}
function copyCSS(path) {
  console.log(`copy css ${path}`)
  const currentPath = paths.publicCSS
  return gulp
    .src(path)
    .pipe(
      rename(
        (path) =>
          (path.dirname = path.dirname.replace(
            currentPath.replacePattern,
            currentPath.newStr
          ))
      )
    )
    .pipe(dest('./'))
}
function generatePublish(path) {
  const fileName = extractFileName(path)
  console.log(' generatePublish', fileName)
  const meta = getProcessedMeta(getMetaPath(fileName), fileName)
  const compiled = getCompiled(getCompiledPath(fileName))
  generate(getUserJsPath(fileName), meta + compiled)
  return

  function extractFileName(path) {
    return path.replace(
      /(resources|compiled)\\public\\(.*?)\\.*/,
      (match, _p1, filename) => {
        return filename
      }
    ) //replace関数で2つ目のグループを抽出
  }
  function getMetaPath(fileName) {
    return './resources/public/' + fileName + '/' + fileName + '.meta'
  }
  function getCompiledPath(fileName) {
    return './compiled/public/' + fileName + '/' + fileName + '.js'
  }
  function getUserJsPath(fileName) {
    return './publish/' + fileName + '/' + fileName + '.user.js'
  }
  function getCompiled(path) {
    const fs = require('fs')
    return fs.readFileSync(path, {
      encoding: 'utf-8',
    })
  }
  function getProcessedMeta(path, fileName) {
    const fs = require('fs')
    const meta = fs.readFileSync(path, {
      encoding: 'utf-8',
    })
    //メタブロックを行ごとの配列にする
    let metaArr = meta.split(/\r\n|\r|\n/)
    metaArr = removeRequireLocalLine(metaArr)
    metaArr = replaceNameLine(metaArr)
    metaArr = replacenamespaceLine(metaArr)
    metaArr = replaceResouceCSSLine(metaArr, fileName)
    metaArr = addUpdateURL(metaArr, fileName)
    return metaArr.reduce((prev, cur) => {
      return prev + cur + '\r\n'
    }, '')

    function removeRequireLocalLine(arr) {
      return arr.filter((m) => !/^\/\/\s+@require\s+file.*/.test(m))
    }
    function replaceNameLine(arr) {
      //@name欄にprefixを付与する
      const namereg = /^\/\/\s+@name\s+(.*)/
      const index = arr.findIndex((m) => namereg.test(m))
      if (index >= 0) {
        const newLine = arr[index].replace(namereg, function (match, p1) {
          return match.replace(p1, myPrefix + p1)
        })
        arr.splice(index, 1, newLine)
      }
      return arr
    }
    function replacenamespaceLine(arr) {
      //@namespace欄にprefixを付与する
      const namespaceReg = /^\/\/\s+@namespace\s+(.*)/
      const index = arr.findIndex((m) => namespaceReg.test(m))
      if (index >= 0) {
        const newLine = arr[index].replace(namespaceReg, function (match, p1) {
          return match.replace(p1, myPrefix + p1)
        })
        arr.splice(index, 1, newLine)
      }
      return arr
    }

    function replaceResouceCSSLine(arr, fileName) {
      //@resource欄をローカルからgithubのURLに置き換える
      const index = arr.findIndex((m) =>
        /^\/\/\s+@resource\s+IMPORTED_CSS.*/.test(m)
      )
      if (index >= 0) {
        const newLine = `// @resource     IMPORTED_CSS https://raw.githubusercontent.com/prhm0998/MyUserScript/master/publish/${fileName}/${fileName}.css`
        arr.splice(index, 1, newLine)
      }
      return arr
    }
    function addUpdateURL(arr, fileName) {
      //@updateURL欄を付与する
      arr.splice(
        arr.length - 2,
        0,
        `// @updateURL    https://github.com/prhm0998/MyUserScript/raw/master/publish/${fileName}/${fileName}.user.js`
      )
      return arr
    }
  }
  async function generate(path, data) {
    const fs = require('fs')
    const mkdirp = require('mkdirp')
    const getDirName = require('path').dirname
    try {
      await mkdirp(getDirName(path))
      fs.writeFileSync(path, data)
    } catch (e) {
      console.log(e.message)
    }
  }
}

function watchSCSS() {
  const path = paths.scss
  return watch(path.watch).on('change', path.func)
}
function watchPublicCSS() {
  const path = paths.publicCSS
  return watch(path.watch).on('change', path.func)
}
function watchPublicJS() {
  const path = paths.publicJs
  return watch(path.watch).on('change', path.func)
}

exports.default = parallel(watchSCSS, watchPublicCSS, watchPublicJS, watchTS)
