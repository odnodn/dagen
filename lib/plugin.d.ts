import { Object } from '@quenk/noni/lib/data/json';
import { Future } from '@quenk/noni/lib/control/monad/future';
import { Plugin as GeneratorPlugin, Nunjucks } from './compiler/generator/nunjucks';
import { Context, Plugin as CompilerPlugin } from './compiler';
import { Schema } from './schema';
/**
 * PluginProvider type.
 */
export declare type PluginProvider = (c: Context) => Plugin;
/**
 * Plugin allows various stages of data generation to be intercepted and
 * modified before final output.
 */
export interface Plugin extends CompilerPlugin, GeneratorPlugin {
    /**
     * configure the Plugin.
     */
    configure(c: Conf): Future<Conf>;
}
/**
 * Conf is expected to be a set of key value pairs
 * where each key is a plugin name and the value it's configuration.
 */
export interface Conf {
    [key: string]: Object;
}
/**
 * AbstractPlugin can be extended to partially implement a plugin.
 */
export declare abstract class AbstractPlugin implements Plugin {
    context: Context;
    constructor(context: Context);
    abstract name: string;
    configure(c: Conf): Future<Conf>;
    beforeOutput(s: Schema): Future<Schema>;
    configureGenerator(gen: Nunjucks): Future<Nunjucks>;
}
/**
 * CompositePlugin combines mulitple plugins into one.
 */
export declare class CompositePlugin implements Plugin {
    plugins: Plugin[];
    constructor(plugins: Plugin[]);
    /**
     * @private
     */
    empty(): boolean;
    configure(c: Conf): Future<Conf>;
    beforeOutput(s: Schema): Future<Schema>;
    configureGenerator(gen: Nunjucks): Future<Nunjucks>;
}
