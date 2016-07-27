let fs = require('fs');
let path = require('path');

let {Minimatch} = require('minimatch');

const GLOBAL_TAG = /^global:/;

function loadConfig(context, ref) {
  let filename = path.resolve(context, ref);
  if (!fs.existsSync(filename)) {
    return null;
  } else {

    let options = require(filename);

    if (
      options.module &&
      options.module.loaders &&
      !Array.isArray(options.module.loaders)
    ) {
      options.module.loaders = configureLoaderList(options.module.loaders);
    }

    if (
      options.module &&
      options.module.preLoaders &&
      !Array.isArray(options.module.preLoaders)
    ) {
      options.module.preLoaders = configureLoaderList(options.module.preLoaders);
    }

    return options;
  }
}

function configureLoaderList(loaderConfig) {
  let loaderList = [];
  for (let test in loaderConfig) {
    let config = loaderConfig[test];

    let global = false;
    if (GLOBAL_TAG.exec(test)) {
      global = true;
      test = test.replace(GLOBAL_TAG, '');
    }

    if (!Array.isArray(config)) {
      config = [config];
    }
    config.forEach(config => {
      if (typeof config === 'string') {
        config = {loader: config};
      }
      loaderList.push(configureLoader(Object.assign({}, config, {test, global})));
    });
  }
  return loaderList;
}

function configureLoader({test, loader, query, global}) {
  if (typeof test === 'string') {
    let matcher = new Minimatch(test, {dot: true});
    test = filename => matcher.match(filename);
  }
  let exclude = global ? undefined : /node_modules/;
  let spec = {test, loader, query, exclude};
  return spec;
}


module.exports = {loadConfig};
