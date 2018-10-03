import path = require('path');
import { ClassDeclaration, InterfaceDeclaration, Project } from 'ts-simple-ast';

interface Options {
    fileGlobs: (string[]) | string;
    unionName: string;
    outputFile: string;
}

export default class UnionGenerator {
    options: Options;

    constructor(options: Options) {
        this.options = options;
    }

    apply(compiler) {
        compiler.hooks.beforeCompile.tap(
            'WebpackUnionGenerator',
            (compilation) => {
                this.generate();
            }
        );
    }

    generate() {
        const project = new Project();
        project.addExistingSourceFiles(this.options.fileGlobs);

        const outputFolder = path.dirname(this.options.outputFile);
        const sourceFiles = project.getSourceFiles();

        const interfaces = sourceFiles
            .reduce((prev, next) => [...prev, ...next.getInterfaces().filter(i => i.isExported)], <InterfaceDeclaration[]>[]);

        const classes = sourceFiles
            .reduce((prev, next) => [...prev, ...next.getClasses()], <ClassDeclaration[]>[]);

        const types = [...interfaces, ...classes];

        const outputFile = project.getSourceFile(this.options.outputFile)
            || project.createSourceFile(this.options.outputFile);

        let generatedType = outputFile.getTypeAlias(this.options.unionName);
        // If we have already generated all we need, return.
        if (generatedType) {
            const typeStrings = generatedType
                .getTypeNode()
                .getFullText()
                .trim()
                .split(' | ');

            const filtered = typeStrings
                .filter(name => {
                    if (types.some(ty => ty.getName() == name)) {
                        return false;
                    } else {
                        console.log(name);
                        return true;
                    }
                });

            if (typeStrings.length == types.length && filtered.length === 0) {
                return;
            }
        }

        outputFile.getImportDeclarations().forEach(i => i.remove());

        for (const t of types) {
            let name = t.getName();
            let importPath = t.getSourceFile().getFilePath();
            importPath = './' + path.relative(outputFolder, importPath);

            importPath = importPath.substr(0, importPath.lastIndexOf('.'));

            const declaration = outputFile.addImportDeclaration({
                moduleSpecifier: importPath,
            });

            if (t.getText().indexOf('export default') === 0) {
                declaration.setDefaultImport(name);
            } else {
                declaration.addNamedImport(name);
            }
        }

        if (!generatedType) {
            generatedType = outputFile.addTypeAlias({
                type: '',
                name: this.options.unionName,
            });
        }

        const t = types.map(i => i.getName()).join(' | ');
        generatedType.setIsExported(true);
        generatedType.setType(t);

        outputFile.organizeImports();
        outputFile.saveSync();

    }
}