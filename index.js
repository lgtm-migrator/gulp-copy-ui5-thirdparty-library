var through2 = require("through2");
var GulpFile = require('vinyl');
var rollup = require("rollup");
var rollupNodeResolve = require("rollup-plugin-node-resolve");
var rollupCjs = require("rollup-plugin-commonjs");
var { uglify } = require("rollup-plugin-uglify");
var { existsSync, readFileSync } = require("fs");
var { warn } = require("console");

var replaceHtml = (content = "", packages) => {
  var r = /data-sap-ui-resourceroots='(.*?)'/g;
  var groups = r.exec(content);
  if (groups) {
    var original = JSON.parse(groups[1]);
    var packagesObject = packages.reduce((p, c) => { p[c] = c; return p; }, {});
    var resouceroots = Object.assign(packagesObject, original);
    var resoucerootsJson = JSON.stringify(resouceroots);
    return content.replace(r, `data-sap-ui-resourceroots='${resoucerootsJson}'`);
  } else {
    return content;
  }
};

var formatUI5Module = (umdCode, mName) => `sap.ui.define(function(){
  ${umdCode}
  return this.${mName}
})
`;

var rollupTmpConfig = (mAsbPath, mName) => ({
  input: mAsbPath,
  output: {
    file: `${mName}.js`,
    format: 'umd'
  },
  onwarn: function(message) {
    // do nothing
  },
  plugins: [rollupNodeResolve({ preferBuiltins: true }), rollupCjs(), uglify()]
});

const resolve = (mName) => {
  return require.resolve(mName);
};

const bundleModule = async(mName) => {
  const absPath = resolve(mName);
  const bundle = await rollup.rollup(rollupTmpConfig(absPath, mName));
  const generated = await bundle.generate({ format: "umd", name: mName });
  return formatUI5Module(generated.code, mName);
};

module.exports = function({ indexTemplateAbsPath, outputFilePath }) {


  return through2.obj(async function(file, encoding, cb) {

    var packageJson = JSON.parse(file.contents.toString());
    var deps = packageJson.dependencies;
    if (deps) {
      try {
        await Promise
          .all(
            Object.keys(deps).map(async d => {
              const code = await bundleModule(d);
              this.push(new GulpFile({
                path: `${d}.js`,
                contents: Buffer.from(code)
              }));
            })
          );
      } catch (error) {
        cb(error);
      }
    }
    if (indexTemplateAbsPath) {

      if (existsSync(indexTemplateAbsPath)) {

        var indexHtml = replaceHtml(
          readFileSync(indexTemplateAbsPath, { encoding: "utf-8" }),
          Object.keys(deps)
        );

        this.push(new GulpFile({
          path: outputFilePath || "index.html",
          contents: Buffer.from(indexHtml)
        }));

      } else {
        warn(`${indexTemplateAbsPath} not exist, so gulp-copy-ui5-thirdparty-library wont replace the template`);
      }

    }

    cb();

  });
};