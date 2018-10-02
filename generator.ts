import path = require('path');
import { ClassDeclaration, InterfaceDeclaration, Project } from 'ts-simple-ast';

interface Options {
    fileGlobs: (string[]) | string;
    unionName: string;
    outputFile: string;
}

export default class UnionGenerator {
    options: Options;
    project: Project = new Project();

    constructor(options: Options) {
        this.options = options;
        this.project.addExistingSourceFiles(options.fileGlobs);
    }

    apply(compiler) {
      compiler.hooks.compile.tap(
        'WebpackUnionGenerator',
        () => this.generate()
      );
    }

    generate() {
        const outputFolder = path.dirname(this.options.outputFile);
        const sourceFiles = this.project.getSourceFiles();

        const interfaces = sourceFiles
            .reduce((prev, next) => [...prev, ...next.getInterfaces().filter(i => i.isExported)], <InterfaceDeclaration[]>[]);

        const classes = sourceFiles
            .reduce((prev, next) => [...prev, ...next.getClasses()], <ClassDeclaration[]>[]);


        const types = [...interfaces, ...classes];
            
        const outputFile = this.project.getSourceFile(this.options.outputFile)
            || this.project.createSourceFile(this.options.outputFile);

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

        let type = outputFile.getTypeAlias(this.options.unionName)
            || outputFile.addTypeAlias({
                type: '',
                name: this.options.unionName,
            });

        const t = types.map(i => i.getName()).join(' | ');
        type.setIsExported(true);
        type.setType(t);
       
        outputFile.organizeImports();
        outputFile.saveSync();

    }
}