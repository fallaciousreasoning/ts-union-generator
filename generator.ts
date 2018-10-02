import { Project } from 'ts-simple-ast';

interface Options {
    fileGlobs: (string[]) | string;
    unionName: string;
    outputFile: string;
}

class UnionGenerator {
    options: Options;
    project: Project = new Project();

    constructor(options: Options) {
        this.options = options;
        this.project.addExistingSourceFiles(options.fileGlobs);
    }

    generate() {
        const sourceFiles = this.project.getSourceFiles();
        const interfaces = this.project.getSourceFiles().reduce((prev, next) => [...prev, ...next.getInterfaces()], []);
        const outputFile = this.project.createSourceFile(this.options.outputFile);
        const type = outputFile.addTypeAlias({ 
            name: this.options.unionName, 
            isExported: true,
            type: 'number'
         });
    }
}

let thing = new UnionGenerator({
    fileGlobs: '../src/components',
    outputFile: '../src/components/component.ts',
    unionName: 'Component'
})
thing.generate();