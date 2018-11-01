# gulp-copy-ui5-thirdparty-library

[![npm version](https://badge.fury.io/js/gulp-copy-ui5-thirdparty-library.svg)](https://badge.fury.io/js/gulp-copy-ui5-thirdparty-library)
[![GitHub license](https://img.shields.io/github/license/Soontao/gulp-copy-ui5-thirdparty-library.svg)](https://github.com/Soontao/gulp-copy-ui5-thirdparty-library/blob/master/LICENSE)

Next-Generation-UI5 modules, support ui5 use ALL modules in npm environment.

![](https://openui5.org/images/OpenUI5_new_big_side.png)


## internal

This plugin will use `rollup` to package nodejs module to `umd` format and copy its to destination with ui5 module defination format:

```js
sap.ui.define("lodash", function() {
  
  // ... umd module defination

  return this.lodash;

})
```
