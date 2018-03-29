#! /usr/bin/env node
///<reference path='docopt.d.ts'/>
import * as path from 'path';
import * as docopt from 'docopt';
import * as Promise from 'bluebird';
import { resolve } from 'bluebird';
import { fuse } from 'afpl/lib/util';
import { Document, execute, options2Program, readDocument, Options } from '.';

const BIN = path.basename(__filename);

const defaultOptions = () => ({

    templates: process.cwd()

});

const concern = (s: string) => {

    let ext = path.extname(s).substr(1);
    return ext ? ext : '';

}

/**
 * Arguments that are excepted from the command line.
 */
export interface Arguments {

    '<file>': string,
    '--template'?: string,
    '--context'?: string[],
    '--templates'?: string,
    '--plugin'?: string[],
    '--concern'?: string
    '--set'?: string[],

}

/**
 * args2Options converts command line options to an Options record.
 */
export const args2Options = (args: Arguments): Options =>
    ({
        file: args['<file>'],
        template: args['--template'] || '',
        contexts: args['--context'],
        templates: args['--templates'] || process.cwd(),
        plugins: args['--plugin'],
        concern: args['--concern'] || concern(args['--template'] || ''),
        sets: args['--set'] || []
    });

const _read = (args: Arguments) => (file: string): Promise<Document> => file ?
    readDocument(args['<file>']) :
    resolve({ type: 'object', properties: {} });

const args = docopt.docopt<Arguments>(`

Usage:
   ${BIN} [options] [--plugin=PATH...] [--context=PATH...] [--set=KVP...] <file>
   ${BIN} [options] [--plugin=PATH...] [--context=PATH...] [--set=KVP...]

Options:
  -h --help                  Show this screen.
  --template TEMPLATE        Specify the template to use when generating code.
  --templates PATH           Path to resolve templates from. Defaults to process.cwd().
  --plugin PATH              Path to a plugin that will be loaded at runtime.
  --context PATH             Path to a javascript object that will be merged into the document's context.
  --concern EXT              Forces the concern to be EXT.
  --set PATH=VALUE           Sets a value in the context, prefix the value with 'require://' to load from file.
  --version                  Show version.
`, {
        version: require('../package.json').version
    });

Promise
    .resolve(args['<file>'] == null ? args['<file>'] : String(args['<file>']).trim())
    .then(file =>
        (_read(args)(file))
            .then(options2Program(fuse(defaultOptions(), args2Options(args))))
            .then(execute)
            .then(console.log)
            .catch((e: Error) => console.error(e.stack)));
