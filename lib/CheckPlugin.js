let path = require('path');
let {Minimatch} = require('minimatch');

let PrefetchContextPlugin = require('./PrefetchContextPlugin');

const NULL_LOADER = require.resolve('./null-loader');

function parsePatternToContextTest(pattern, global) {
  let matcher = new Minimatch(pattern);
  let context = [];
  for (let i = 0; i < matcher.set[0].length; i++) {
    if (typeof matcher.set[0][i] === 'string') {
      context.push(matcher.set[0][i]);
    } else {
      break;
    }
  }
  context = context.join('/');
  let localPattern = pattern.slice(context.length);
  if (localPattern[0] === '/') {
    localPattern = localPattern.slice(1);
  }
  matcher = new Minimatch(localPattern);
  return {
    context,
    test: {
      test: (filename) => {
        let ok;
        if (!global && !/^\.\//.exec(filename)) {
          ok = false;
        } else {
          filename = filename.slice(2);
          ok = matcher.match(filename);
        }
        console.log(filename, ok);
        return ok;
      },
      toString: () => pattern,
    },
  };
}

class CheckPlugin {

  constructor({context, pattern, loader}) {
    this.pattern = pattern;
    this.loader = loader;

    let global = false;

    if (/^global:/.exec(pattern)) {
      pattern = pattern.replace(/^global:/, '');
      global = true;
    }

    let {test, context: testContext} = parsePatternToContextTest(pattern, global);

    this.prefetchContext = new PrefetchContextPlugin({
      context: path.join(context, testContext),
      test,
      loader: [NULL_LOADER, loader],
    });
  }

  apply(compiler) {
    this.prefetchContext.apply(compiler);
  }
}

module.exports = CheckPlugin;
