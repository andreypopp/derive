let eslint = require('eslint')
let loaderUtils = require('loader-utils')
let formatCodeFrame = require('babel-code-frame');

function ESLintError(eslint, source) {
  Error.call(this);
  Error.captureStackTrace(this, ESLintError);

  this.eslint = eslint;
  this.source = source;
  this.message = `${eslint.message.replace(/\.$/, '')} (line ${eslint.line} column ${eslint.column})`;
}

ESLintError.prototype = Object.create(Error.prototype);
ESLintError.prototype.constructor = ESLintError;
ESLintError.prototype.toString = function() {
  let header = `Code Style Warning: ${this.message}:\n`;
  let codeFrame = formatCodeFrame(
    this.source,
    this.eslint.line,
    this.eslint.column
  );
  return header + '\n' + codeFrame;
};

function eslintLoader(input, map) {
  this.cacheable()

  this._compiler._eslintLoaderCache = this._compiler._eslintLoaderCache || {};
  if (this._compiler._eslintLoaderCache[this.query] === undefined) {
    let config = loaderUtils.parseQuery(this.query);
    let engine = new eslint.CLIEngine(config)
    this._compiler._eslintLoaderCache[this.query] = {engine, config};
  }

  let {engine, config} = this._compiler._eslintLoaderCache[this.query];

  let resourcePath = this.resourcePath
  let cwd = process.cwd()

  // remove cwd from resource path in case webpack has been started from project
  // root, to allow having relative paths in .eslintignore
  if (resourcePath.indexOf(cwd) === 0) {
    resourcePath = resourcePath.substr(cwd.length + 1)
  }

  let res = engine.executeOnText(input, resourcePath, true)
  // executeOnText ensure we will have res.results[0] only

  // skip ignored file warning
  if (!(
    res.warningCount === 1 &&
    res.results[0].messages[0] &&
    res.results[0].messages[0].message &&
    res.results[0].messages[0].message.indexOf('ignore') > 1
  )) {

    // if enabled, use eslint auto-fixing where possible
    if (config.fix && res.results[0].output) {
      eslint.CLIEngine.outputFixes(res)
    }

    if (res.errorCount || res.warningCount) {
      res.results[0].messages.forEach(message => {
        this.emitWarning(new ESLintError(message, input));
      });
    }
  }
  this.callback(null, input, map)
}

module.exports = eslintLoader;
