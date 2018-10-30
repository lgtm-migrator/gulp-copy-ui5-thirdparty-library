var through2 = require("through2");
var File = require('vinyl');
var rollup = require("rollup");
var rollupNodeResolve = require("rollup-plugin-node-resolve");
var rollupCjs = require("rollup-plugin-commonjs");
var { uglify } = require("rollup-plugin-uglify");

var indexHtmlTemplate = (
  namespace,
  resourceHost = "openui5.hana.ondemand.com",
  packages = [],
  indexPageTitle = "UI5 Project",
) => {
  var packagesObject = packages.reduce((p, c) => { p[c] = c; return p; }, {});
  var resouceroots = Object.assign(packagesObject, { [namespace]: "." });
  var resoucerootsJson = JSON.stringify(resouceroots);
  return `<!DOCTYPE html>
  <html>
  
  <head>
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta charset="utf-8">
      <title>
          ${indexPageTitle}
      </title>
      <script 
          id="sap-ui-bootstrap" 
          src="https://${resourceHost}/resources/sap-ui-core.js" 
          data-sap-ui-theme="sap_belize"
          data-sap-ui-libs="sap.m" 
          data-sap-ui-compatVersion="edge" 
          data-sap-ui-resourceroots='${resoucerootsJson}'
      >
      </script>
  </head>
  
  <body class="sapUiBody" id="content">
      <script src="./index.js"></script>
  </body>
  
  </html>
  `;
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
  onwarn: function (message) {
    // do nothing
  },
  plugins: [rollupNodeResolve({ preferBuiltins: true, }), rollupCjs(), uglify()]
});

const resolve = (mName) => {
  return require.resolve(mName);
};

const bundleModule = async (mName) => {
  const absPath = resolve(mName);
  const bundle = await rollup.rollup(rollupTmpConfig(absPath, mName));
  const generated = await bundle.generate({ format: "umd", name: mName });
  return formatUI5Module(generated.code, mName);
};

module.exports = function (
  { namespace,
    resouceHost = "openui5.hana.ondemand.com",
    indexPageTitle = "UI5 Project",
    indexPageTarget = "index-with-lib.html"
  }
) {

  if (!namespace) {
    throw new Error("You must set namespace for gulp-copy-ui5-thirdparty-library !");
  }

  return through2.obj(async function (file, encoding, cb) {
    var packageJson = JSON.parse(file.contents.toString());
    var deps = packageJson.dependencies;
    if (deps) {
      try {
        await Promise
          .all(
            Object.keys(deps).map(async d => {
              const code = await bundleModule(d);
              this.push(new File({
                path: `${d}.js`,
                contents: Buffer.from(code)
              }));
            })
          );
      } catch (error) {
        cb(error);
      }
    }
    var indexHtml = indexHtmlTemplate(
      namespace,
      resouceHost,
      deps ? Object.keys(deps) : [],
      indexPageTitle
    );

    this.push(new File({
      path: indexPageTarget,
      contents: Buffer.from(indexHtml)
    }));

    cb();

  });
};