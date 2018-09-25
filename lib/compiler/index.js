"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const record_1 = require("@quenk/noni/lib/data/record");
const either_1 = require("@quenk/noni/lib/data/either");
const path_1 = require("../schema/path");
const namespace_1 = require("../schema/path/namespace");
const loader_1 = require("../schema/loader");
const definitions_1 = require("../schema/definitions");
const builtin_1 = require("../schema/checks/builtin");
const schema_1 = require("../schema");
/**
 * Context compilation takes place in.
 *
 * @property namespaces - Used todistinguish which properties are in effect.
 * @property checks     - Checks to be applied to the schema once it is compiled.
 * @property loader     - Loader used to resolve fragment references.
 */
class Context {
    constructor(definitions, namespaces, checks, loader, plugins) {
        this.definitions = definitions;
        this.namespaces = namespaces;
        this.checks = checks;
        this.loader = loader;
        this.plugins = plugins;
    }
    /**
     * addDefinitions to the Context.
     */
    addDefinitions(defs) {
        return new Context(record_1.merge(this.definitions, defs), this.namespaces, this.checks, this.loader, this.plugins);
    }
}
exports.Context = Context;
/**
 * pathExpansion stage.
 *
 * Nested property short-hand is expanded to full JSON object representation.
 */
exports.pathExpansion = (o) => Promise.resolve(path_1.expand(o));
/**
 * nameSubstitution stage.
 *
 * During this tage the processing program calculates the effective namespace.
 */
exports.namespaceSubstitution = (c) => (o) => Promise.resolve(namespace_1.normalize(c.namespaces)(o));
/**
 * fragmentResolution stage.
 *
 * During this stage, ref properties are recursively resolved and merged into
 * their owners.
 */
exports.fragmentResolution = (c) => (o) => (loader_1.load(c.loader)(o));
/**
 * schemaExpansion stage.
 *
 * During this stage, short-hand such as `"type": "string"` are expanded
 * to full JSON objects in supported places.
 */
exports.schemaExpansion = (o) => Promise.resolve(schema_1.expand(o));
/**
 * definitionRegistration stage.
 *
 * During this stage, the processing program registers each definition
 * under their respective names.
 */
exports.definitionRegistration = (c) => (o) => Promise
    .resolve(record_1.isRecord(o.definitions) ?
    c.addDefinitions(o.definitions) : c);
/**
 * definitionMerging
 * At this stage all usage of defined types are resolved.
 */
exports.definitionMerging = (o) => (c) => either_1.either(mergingFailed(c))(mergingComplete)(definitions_1.resolve(c.definitions)(o));
const mergingFailed = (c) => (f) => Promise.reject(f.toError({}, c));
const mergingComplete = (o) => Promise.resolve(o);
/**
 * checksStage applies schema and custom checks.
 *
 * This stage determines whether the object is fit for use.
 */
exports.checkStage = (c) => (o) => either_1.either(checksFailed(c))(Promise.resolve)(c.checks.reduce(chainCheck, builtin_1.check(o)));
const checksFailed = (c) => (f) => Promise.reject(f.toError({}, c));
const chainCheck = (pre, curr) => pre.chain(curr);
/**
 * compile a JSON document into a valid document schema.
 */
exports.compile = (c) => (j) => exports.pathExpansion(j)
    .then(exports.namespaceSubstitution(c))
    .then(exports.fragmentResolution(c))
    .then(exports.schemaExpansion)
    .then((j) => (exports.definitionRegistration(c)(j))
    .then((c) => (exports.definitionMerging(j)(c))
    .then(exports.checkStage(c))));
//# sourceMappingURL=index.js.map