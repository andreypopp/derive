let chalk = require('chalk');

function createFormatter({format: _format, formatLabel}) {

  let format = (msg, options = {}) => {
    msg = _format(msg);
    if (options.label) {
      msg = formatLabel(' ' + options.label + ' ') + ' ' + msg;
    }
    return msg;
  };

  let write = (msg, options = {}) => {
    msg = format(msg, options);
    process.stdout.write(msg + (options.noNewLine ? '' : '\n'));
  };

  write.format = format;

  return write;
}

let regular = createFormatter({
  format: msg => msg,
  formatLabel: chalk.bgBlue.black,
});

let success = createFormatter({
  format: chalk.green,
  formatLabel: chalk.bgGreen.black,
});

let warning = createFormatter({
  format: chalk.yellow,
  formatLabel: chalk.bgYellow.black,
});

let error = createFormatter({
  format: chalk.red,
  formatLabel: chalk.bgRed.black,
});

let newLine = () => {
  process.stdout.write('\n');
};

function clear() {
  process.stdout.write('\033[2J');
  process.stdout.write('\033[0f');
}

module.exports = {
  newLine, clear,
  regular, success, warning, error
};


