let ContextDependency = require('webpack/lib/dependencies/ContextDependency');
let invariant = require('invariant');

let Config = require('./Config');

class PrefetchContextPlugin {

  constructor(config) {
    invariant(
      config.test,
      'PrefetchContextPlugin: needs to be configured with test regexp'
    );
    this.config = config;
  }

  apply(compiler) {
    let context = this.config.context ?
      this.config.context :
      compiler.context;

    compiler.plugin('compilation', (compilation, params) => {
      compilation.dependencyFactories.set(
        ContextDependency,
        params.contextModuleFactory
      );
    });

    compiler.plugin('make', (compilation, cb) => {
      let request = this.config.loader
        ? `!!${Config.request(this.config.loader)}!${context}`
        : `!!${context}`;
      let dep = new ContextDependency(request, true, this.config.test);
      compilation.prefetch(context, dep, err => {
        if (err) {
          cb(err);
        } else {
          cb(null);
        }
      });
    });
  }
}

module.exports = PrefetchContextPlugin;
