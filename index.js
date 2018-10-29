var through2 = require("through2");
var File = require('vinyl');
var rollup = require("rollup");
var rollupNodeResolve = require("rollup-plugin-node-resolve");
var rollupCjs = require("rollup-plugin-commonjs");

var formatUI5Module = (umdCode, mName) => `sap.ui.define(function(){
  ${umdCode}
  return this.${mName}
})
`;

var rollupTmpConfig = (mAsbPath, mName) => ({
  input: mAsbPath,
  preferBuiltins: false,
  output: {
    file: `${mName}.js`,
    format: 'umd'
  },
  plugins: [rollupNodeResolve(), rollupCjs()]
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

module.exports = function() {

  return through2.obj(function(file, encoding, cb) {
    try {
      var packageJson = JSON.parse(file.contents.toString());
      var deps = packageJson.dependencies;
      if (deps) {
        Promise
          .all(
            Object.keys(deps).map(async d => {
              const code = await bundleModule(d);
              this.push(new File({
                path: `${d}.js`,
                contents: Buffer.from(code)
              }));
            })
          )
          .then(() => {
            cb();
          })
          .catch(err => {
            cb(err);
          });
      } else {
        cb();
      }
    } catch (error) {
      cb(error);
    }
  });
};