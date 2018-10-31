# gulp-copy-ui5-thirdparty-library

![](https://openui5.org/images/OpenUI5_new_big_side.png)

Next-Generation-UI5 modules, support ui5 use ALL modules in npm environment.

## internal

this plugin will use `rollup` topackage nodejs module to `umd` format and copy its to destination with ui5 module defination format:

```js
sap.ui.define("lodash", function() {
  
  // ... umd module code

  return this.lodash;

})
```