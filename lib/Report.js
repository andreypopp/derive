let {
  groupBy,
  forEach,
} = require('lodash');
let formatCodeFrame = require('babel-code-frame');
let RequestShortener = require('webpack/lib/RequestShortener');

let Terminal = require('./Terminal');

function formatPostCSSErrorMessage(e) {

  let header = `Syntax Error: ${e.error.reason} (line ${e.error.line} column ${e.error.column}):\n`;

  if (!(e.error && e.error.input && e.error.input.source)) {
    return header;
  }

  return [
    header,
    formatCodeFrame(e.error.input.source, e.error.line, e.error.column),
  ].join('\n');
}

function formatBabelError(e) {
  if (e.error.constructor.name === 'SyntaxError') {
    let message = e.error.message
      .replace(/^[^:]+: /, '')
      .replace(/ \(\d+:\d+\)$/, '');
    let loc = e.error.loc;
    return [
      `Syntax Error: ${message} (line ${loc.line} column ${loc.column}):\n`,
      e.error.codeFrame,
    ].join('\n');
  } else {
    return [
      e.error.message,
      e.error.codeFrame,
    ].join('\n');
  }
}

function formatSASSError(error, stats, compilation) {
  let inputFileSystem = compilation.compiler.inputFileSystem;

  let {line, column} = error.error;
  let message = error.error.message.split('\n')[3];
  if (message) {
    message = `Syntax Error: ${message.trim()} (line ${line} column ${column}):`;
  } else {
    message = error.error.message;
  }

  let source = inputFileSystem._readFileStorage.data[error.error.file];
  if (source) {
    source = source[1].toString();
    let codeFrame = formatCodeFrame(source, line, column);
    return message + '\n\n' + codeFrame;
  } else {
    return message;
  }
}

class ErrorReportBase {

  constructor(stats, context, error) {
    this.stats = stats;
    this.context = context;
    this.error = error;

    this._requestShortener = new RequestShortener(context);
  }

  getHeader() {
    if (this.error.module && this.error.module.resource) {
      return this._requestShortener.shorten(this.error.module.resource);
    } else if (this.error.file) {
      return this.error.file;
    } else {
      return '';
    }
  }
}

class ErrorReport extends ErrorReportBase {

  print() {
    Terminal.error('', {label: 'E', noNewLine: true});
    Terminal.regular(this.getMessage());
  }

  getMessage() {
    if (typeof this.error === 'string') {
      return this.error;
    }
    // Handle babel errors gracefully
    if (this.error.error && this.error.error._babel) {
      return formatBabelError(this.error, this.stats, this.stats.compilation);
    } else if (this.error.error && this.error.error.name === 'CssSyntaxError') {
      return formatPostCSSErrorMessage(this.error, this.stats, this.stats.compilation);
    } else if (
      'status' in this.error.error &&
      'hideStack' in this.error.error &&
      'formatted' in this.error.error &&
      'file' in this.error.error &&
      'line' in this.error.error &&
      'column' in this.error.error
    ) {
      return formatSASSError(this.error, this.stats, this.stats.compilation);
    } else {
      return this.error.message;
    }
  }

}

class WarningReport extends ErrorReportBase {

  print() {
    Terminal.warning('', {label: 'W', noNewLine: true});
    Terminal.regular(this.getMessage());
  }

  getMessage() {
    if (typeof this.error === 'string') {
      return this.error;
    } else {
      return this.error.message;
    }
  }
}

function printStatus(stats) {
  let timing = stats.endTime - stats.startTime;
  if (stats.hasErrors()) {
    Terminal.error(`complete with errors`, {label: 'BUILD'});
    Terminal.error(`time: ${timing}ms, errors: ${stats.compilation.errors.length}, warnings: ${stats.compilation.warnings.length}`, {label: 'STATS'});
  } else if (stats.hasWarnings()) {
    Terminal.warning(`complete with warnings`, {label: 'BUILD'});
    Terminal.warning(`time: ${timing}ms, warnings: ${stats.compilation.warnings.length}`, {label: 'STATS'});
  } else {
    Terminal.success(`complete`, {label: 'BUILD'});
    Terminal.success(`time: ${timing}ms`, {label: 'STATS'});
  }
}

function printReport(stats, options) {
  printStatus(stats);

  let errorList = [];

  if (stats.compilation.errors.length > 0) {
    errorList = errorList.concat(
      stats.compilation.errors.map(error =>
        new ErrorReport(stats, options.context, error)));
  }

  if (stats.compilation.warnings.length > 0) {
    errorList = errorList.concat(
      stats.compilation.warnings.map(warning =>
        new WarningReport(stats, options.context, warning)));
  }

  let errorPrintedCountTotal = 0;

  forEach(
    groupBy(errorList, rep => rep.getHeader()),
    (reportList, resource) => {

      let errorPrintedCountLocal = 0;

      let errorCount = reportList
        .filter(report => report instanceof ErrorReport)
        .length;

      let warningCount = reportList
        .filter(report => report instanceof WarningReport)
        .length;

      if (errorPrintedCountTotal < 15 || errorCount > 0) {

        if (resource !== '') {
          if (errorCount) {
            Terminal.newLine();
            Terminal.error(resource, {label: 'MODULE'});
          } else {
            Terminal.newLine();
            Terminal.warning(resource, {label: 'MODULE'});
          }
        }

        forEach(reportList, report => {
          if (errorCount && report instanceof WarningReport) {
            return;
          }
          if (errorPrintedCountLocal >= 5 && report instanceof WarningReport) {
            return;
          }
          Terminal.newLine();
          errorPrintedCountTotal++;
          errorPrintedCountLocal++;
          report.print();
        });

        if (errorCount === 0 && errorPrintedCountLocal - errorCount < warningCount) {
          Terminal.newLine()
          Terminal.warning(`... more ${warningCount - errorPrintedCountLocal + errorCount} warnings`);
        }

      } else {

        Terminal.newLine();
        Terminal.warning(`${resource} (${warningCount} warnings)`, {label: 'MODULE'});

      }
    }
  );
}

module.exports = {printReport};
