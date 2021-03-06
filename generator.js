"use strict";
exports.__esModule = true;
var path = require("path");
var ts_simple_ast_1 = require("ts-simple-ast");
var UnionGenerator = /** @class */ (function () {
    function UnionGenerator(options) {
        this.options = options;
    }
    UnionGenerator.prototype.apply = function (compiler) {
        var _this = this;
        compiler.hooks.beforeCompile.tap('WebpackUnionGenerator', function (compilation) {
            _this.generate();
        });
    };
    UnionGenerator.prototype.generate = function () {
        var _this = this;
        var project = new ts_simple_ast_1.Project();
        project.addExistingSourceFiles(this.options.fileGlobs);
        var outputFolder = path.dirname(this.options.outputFile);
        var sourceFiles = project.getSourceFiles();
        var interfaces = sourceFiles
            .reduce(function (prev, next) { return prev.concat(next.getInterfaces().filter(function (i) { return i.isExported; })); }, []);
        var classes = sourceFiles
            .reduce(function (prev, next) { return prev.concat(next.getClasses()); }, []);
        var ts = sourceFiles
            .reduce(function (prev, next) { return prev.concat(next.getTypeAliases()); }, []);
        var types = interfaces.concat(classes, ts).filter(function (t) { return t.isExported() && t.getName() !== _this.options.unionName; });
        var outputFile = project.getSourceFile(this.options.outputFile)
            || project.createSourceFile(this.options.outputFile);
        var generatedType = outputFile.getTypeAlias(this.options.unionName);
        // If we have already generated all we need, return.
        if (generatedType) {
            var typeStrings = generatedType
                .getTypeNode()
                .getFullText()
                .trim()
                .split(' | ');
            var filtered = typeStrings
                .filter(function (name) {
                if (types.some(function (ty) { return ty.getName() == name; })) {
                    return false;
                }
                else {
                    console.log(name);
                    return true;
                }
            });
            if (typeStrings.length == types.length && filtered.length === 0) {
                return;
            }
        }
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
        if (!generatedType) {
            generatedType = outputFile.addTypeAlias({
                type: '',
                name: this.options.unionName
            });
        }
        var t = types.map(function (i) { return i.getName(); }).join(' | ');
        generatedType.setIsExported(true);
        generatedType.setType(t);
        outputFile.organizeImports();
        outputFile.saveSync();
    };
    return UnionGenerator;
}());
exports["default"] = UnionGenerator;
