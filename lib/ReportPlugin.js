let Report = require('./Report');

class ReportPlugin {

  apply(compiler) {
    compiler.plugin('done', stats => {
      Report.printReport(stats, compiler.options);
    });

    compiler.plugin('fail', stats => {
      Report.printReport(stats, compiler.options);
    });
  }
}

module.exports = ReportPlugin;
