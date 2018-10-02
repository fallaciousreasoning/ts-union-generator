var Generator = require('./generator').default;

module.exports = class MyExampleWebpackPlugin {
  constructor(options) {
    this.options = {
      ...options
    };
  }

  apply(compiler) {
    compiler.hooks.compile.tap(
      'WebpackUnionGenerator',
      () => {
        var g = new Generator(this.options);
        g.generate();
      }
    );
  }
}