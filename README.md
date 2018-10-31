# gulp-copy-ui5-thirdparty-library

![](https://openui5.org/images/OpenUI5_new_big_side.png)

Next-Generation-UI5 modules, support ui5 use ALL modules in npm environment.

## internal

this plugin will use `rollup` to package nodejs module into `umd` format, and copy the packaged source to destination with ui5 module format:

```js
sap.ui.define("lodash", function() {
  
  // ... umd module defination

  return this.lodash;

})
```
