let fs = require('fs');
let path = require('path');
let resolve = require('resolve');

let {Minimatch} = require('minimatch');

const GLOBAL_TAG = /^global:/;

const JSON_LOADER = require.resolve('json-loader');
const CSS_LODAER = require.resolve('css-loader');
const STYLE_LOADER = require.resolve('style-loader');
const BABEL_LOADER = require.resolve('babel-loader');
const FILE_LOADER = require.resolve('file-loader');
const URL_LOADER = require.resolve('url-loader');

const BABEL_PRESET_ES2015 = require.resolve('babel-preset-es2015-webpack');
const BABEL_PRESET_REACT = require.resolve('babel-preset-react');
const BABEL_PRESET_STAGE_1 = require.resolve('babel-preset-stage-1');

const DEFAULT_PRESET = {

  devtool: 'cheap-module-eval-source-map',

  module: {

    loaders: {

      '**/*.js': {
        loader: BABEL_LOADER,
        query: {
          presets: [
            BABEL_PRESET_ES2015,
            BABEL_PRESET_STAGE_1,
            BABEL_PRESET_REACT
          ],
          babelrc: false,
        }
      },

      'global:**/*.json': JSON_LOADER,

      'global:**/*.css': [
        STYLE_LOADER,
        CSS_LODAER,
      ],

      'global:**/*.mcss': [
        STYLE_LOADER,
        {loader: CSS_LODAER, query: {modules: true}},
      ],

      // images
      'global:**/*.jpg': FILE_LOADER,
      'global:**/*.png': FILE_LOADER,
      'global:**/*.gif': FILE_LOADER,

      // fonts
      'global:**/*.eot': FILE_LOADER,
      'global:**/*.ttf': FILE_LOADER,
      'global:**/*.woff': FILE_LOADER,
      'global:**/*.svg': FILE_LOADER,
      'global:**/*.woff2': FILE_LOADER,

    }
  }

};

function loadConfig(context, ref) {
  let filename = path.resolve(context, ref);
  let options = {};
  if (!fs.existsSync(filename)) {
    options = {context};
  } else {
    options = require(filename);
  }

  options = applyPreset(options, DEFAULT_PRESET);

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

  if (typeof options.entry === 'string') {
    options.entry = [options.entry];
  } else if (!Array.isArray(options.entry)) {
    for (let name in options.entry) {
      if (typeof options.entry[name] === 'string') {
        options.entry[name] = [options.entry[name]];
      }
    }
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

function merge(a, b) {
  return Object.assign({}, a, b);
}

function applyPreset(config, preset) {
  config = merge(config);
  if (preset.module && preset.module.loaders) {
    config.module = config.module || {};
    config.module.loaders = merge(
      config.module.loaders, preset.module.loaders);
  }
  if (preset.devtool) {
    config.devtool = preset.devtool;
  }
  return config;
}

module.exports = {
  loadConfig,
  resolveLoader,
  request,
  applyPreset,
  DEFAULT_PRESET
};
