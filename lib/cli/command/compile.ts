import * as args from '../args';
import * as nunjucks from 'nunjucks';
import { Future, pure } from '@quenk/noni/lib/control/monad/future';
import { dirname } from 'path';
import { Object } from '@quenk/noni/lib/data/json';
import { Maybe, fromNullable } from '@quenk/noni/lib/data/maybe';
import { Context, compile } from '../../compiler';
import { FileSystemLoader } from '../../schema/loader/file-system';
import { Nunjucks } from '../../compiler/generator/nunjucks';
import {
    loadSchema,
    loadDefinitions,
    loadChecks,
    loadPlugins,
    setValues
} from '../';
import { Command } from './';

/**
 * Args is the normalized form of the command line arguments.
 */
export interface Args {

    schema: string,

    plugin: string[],

    namespace: string[],

    definition: string[],

    templates: string,

    template: string,

    set: string[],

    check: string[]

}

/**
 * Compile command.
 *
 * This command will compile the schema and generate code output if
 * a template is given.
 */
export class Compile {

    constructor(public argv: Args) { }

    static enqueue(argv: Object): Maybe<Command<void>> {

        return fromNullable(new Compile(extract(argv)));

    }

    run(): Future<void> {

        let argv = this.argv;
        let file = argv.schema;

        return loadSchema(file)
            .chain(schema =>
                loadDefinitions(argv.definition)
                    .chain(defs =>
                        loadChecks(argv.check)
                            .chain(checks =>
                                loadPlugins(argv.plugin)
                                    .map(plugins => new Context(
                                        defs,
                                        argv.namespace,
                                        checks,
                                        new FileSystemLoader(dirname(file)),
                                        plugins))))
                    .chain(ctx =>
                        (setValues(schema)(argv.set))
                            .chain(schema => compile(ctx)(schema))
                            .chain((s: Object) => argv.template ?
                                Nunjucks
                                    .create(argv.template,
                                        new nunjucks.FileSystemLoader(argv.templates))
                                    .render(s) :
                                pure(JSON.stringify(s))))
                    .map(console.log));

    }

}

/**
 * extract an Args record using a docopt argument map.
 */
export const extract = (argv: Object): Args => ({

    schema: <string>argv['<file>'],

    plugin: <string[]>argv[args.ARGS_PLUGIN],

    namespace: <string[]>argv[args.ARGS_NAMESPACE],

    definition: <string[]>argv[args.ARGS_DEFINITIONS],

    templates: <string>argv[args.ARGS_TEMPLATES] || process.cwd(),

    template: <string>argv[args.ARGS_TEMPLATE],

    set: <string[]>argv[args.ARGS_SET],

    check: <string[]>argv[args.ARGS_CHECK]

});
