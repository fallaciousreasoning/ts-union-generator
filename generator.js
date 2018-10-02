"use strict";
exports.__esModule = true;
var path = require("path");
var ts_simple_ast_1 = require("ts-simple-ast");
var UnionGenerator = /** @class */ (function () {
    function UnionGenerator(options) {
        this.project = new ts_simple_ast_1.Project();
        this.options = options;
        this.project.addExistingSourceFiles(options.fileGlobs);
    }
    UnionGenerator.prototype.apply = function (compiler) {
        var _this = this;
        compiler.hooks.compile.tap('WebpackUnionGenerator', function () { return _this.generate(); });
    };
    UnionGenerator.prototype.generate = function () {
        var outputFolder = path.dirname(this.options.outputFile);
        var sourceFiles = this.project.getSourceFiles();
        var interfaces = sourceFiles
            .reduce(function (prev, next) { return prev.concat(next.getInterfaces().filter(function (i) { return i.isExported; })); }, []);
        var classes = sourceFiles
            .reduce(function (prev, next) { return prev.concat(next.getClasses()); }, []);
        var types = interfaces.concat(classes);
        var outputFile = this.project.getSourceFile(this.options.outputFile)
            || this.project.createSourceFile(this.options.outputFile);
        outputFile.getImportDeclarations().forEach(function (i) { return i.remove(); });
        for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
            var t_1 = types_1[_i];
            var name_1 = t_1.getName();
            var importPath = t_1.getSourceFile().getFilePath();
            importPath = './' + path.relative(outputFolder, importPath);
            importPath = importPath.substr(0, importPath.lastIndexOf('.'));
            var declaration = outputFile.addImportDeclaration({
                moduleSpecifier: importPath
            });
            if (t_1.getText().indexOf('export default') === 0) {
                declaration.setDefaultImport(name_1);
            }
            else {
                declaration.addNamedImport(name_1);
            }
        }
        var type = outputFile.getTypeAlias(this.options.unionName)
            || outputFile.addTypeAlias({
                type: '',
                name: this.options.unionName
            });
        var t = types.map(function (i) { return i.getName(); }).join(' | ');
        type.setIsExported(true);
        type.setType(t);
        outputFile.organizeImports();
        outputFile.saveSync();
    };
    return UnionGenerator;
}());
exports["default"] = UnionGenerator;
