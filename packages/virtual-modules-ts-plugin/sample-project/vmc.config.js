const pluginFoo = require("./plugin.cjs");
const routerPlugin = require("./plugins/router-plugin.cjs");

module.exports = {
  plugins: [pluginFoo, routerPlugin],
};
