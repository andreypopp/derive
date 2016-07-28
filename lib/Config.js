let fs = require('fs');
let path = require('path');
let resolve = require('resolve');

let {Minimatch} = require('minimatch');

const GLOBAL_TAG = /^global:/;

function loadConfig(context, ref) {
  let filename = path.resolve(context, ref);
  if (!fs.existsSync(filename)) {
    return null;
  } else {

    let options = require(filename);

    if (options.context == undefined) {
      options.context = context;
    }

    if (
      options.module &&
      options.module.loaders &&
      !Array.isArray(options.module.loaders)
    ) {
      options.module.loaders = configureLoaderList(
        options.module.loaders,
        options.context
      );
    }

    if (
      options.module &&
      options.module.preLoaders &&
      !Array.isArray(options.module.preLoaders)
    ) {
      options.module.preLoaders = configureLoaderList(
        options.module.preLoaders,
        options.context
      );
    }

    if (options.plugins == null) {
      options.plugins = [];
    }

    if (!Array.isArray(options.entry)) {
      options.entry = [options.entry];
    }

    if (options.output) {
      if (typeof options.output === 'string') {
        options.output = {
          path: options.output,
        };
      }

      if (options.output.path[0] !== '/') {
        options.output.path = path.join(context, options.output.path);
      }
    }

    return options;
  }
}

function configureLoaderList(loaderConfig, context) {
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
      loaderList.push(configureLoader(Object.assign({}, config, {test, global}), context));
    });
  }
  return loaderList;
}

function configureLoader({test, loader, query, global}, context) {
  if (typeof test === 'string') {
    let matcher = new Minimatch(path.join(context, test), {dot: true});
    test = filename => {
      let ok = matcher.match(filename);
      return ok;
    };
  }
  let exclude = global ? undefined : /node_modules/;
  let spec = {test, loader, query, exclude};
  return spec;
}

function request(...segmentList) {
  return segmentList.map(seg => {
    if (typeof seg === 'string') {
      return seg;
    } else if (Array.isArray(seg)) {
      return request(...seg);
    } else {
      let res = seg.loader;
      if (seg.query) {
        res = res + '?' + JSON.stringify(seg.query);
      }
      return res;
    }
  }).join('!');
}

function resolveLoader(loader, context) {
  if (typeof loader === 'string') {
    loader = resolve.sync(loader, {basedir: context});
  } else {
    loader = Object.assign({}, loader, {
      loader: resolve.sync(loader.loader, {basedir: context})
    });
  }
  return loader;
}

module.exports = {loadConfig, resolveLoader, request};

