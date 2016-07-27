let ProgressPluginBase = require('webpack/lib/ProgressPlugin');
let Terminal = require('./Terminal');

class ProgressPlugin {

  constructor() {
    this.handler = this.handler.bind(this);
    this.progressPlugin = new ProgressPluginBase({handler: this.handler});
  }

  handler(progress, message) {
    progress = Math.floor(progress * 100);
    Terminal.clear();
    Terminal.regular(`${message} ${progress}%`, {label: 'BUILD'});
  }

  apply(compiler) {
    this.progressPlugin.apply(compiler);
    compiler.plugin('compile', () => {
      Terminal.clear();
    });
    compiler.plugin('done', () => {
      Terminal.clear();
    });
    compiler.plugin('fail', () => {
      Terminal.clear();
    });
  }

}

module.exports = ProgressPlugin;
