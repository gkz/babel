// @flow

import type { InputTargets, Targets } from "@babel/helper-compilation-targets";

import type { ConfigItem } from "../item";
import Plugin from "../plugin";

import removed from "./removed";
import {
  msg,
  access,
  assertString,
  assertBoolean,
  assertObject,
  assertArray,
  assertCallerMetadata,
  assertInputSourceMap,
  assertIgnoreList,
  assertPluginList,
  assertConfigApplicableTest,
  assertConfigFileSearch,
  assertBabelrcSearch,
  assertFunction,
  assertRootMode,
  assertSourceMaps,
  assertCompact,
  assertSourceType,
  assertTargets,
  type ValidatorSet,
  type Validator,
  type OptionPath,
  assertAssumptions,
} from "./option-assertions";
import type { UnloadedDescriptor } from "../config-descriptors";

const ROOT_VALIDATORS: ValidatorSet = {
  cwd: (assertString: Validator<$PropertyType<ValidatedOptions, "cwd">>),
  root: (assertString: Validator<$PropertyType<ValidatedOptions, "root">>),
  rootMode: (assertRootMode: Validator<
    $PropertyType<ValidatedOptions, "rootMode">,
  >),
  configFile: (assertConfigFileSearch: Validator<
    $PropertyType<ValidatedOptions, "configFile">,
  >),

  caller: (assertCallerMetadata: Validator<
    $PropertyType<ValidatedOptions, "caller">,
  >),
  filename: (assertString: Validator<
    $PropertyType<ValidatedOptions, "filename">,
  >),
  filenameRelative: (assertString: Validator<
    $PropertyType<ValidatedOptions, "filenameRelative">,
  >),
  code: (assertBoolean: Validator<$PropertyType<ValidatedOptions, "code">>),
  ast: (assertBoolean: Validator<$PropertyType<ValidatedOptions, "ast">>),

  cloneInputAst: (assertBoolean: Validator<
    $PropertyType<ValidatedOptions, "cloneInputAst">,
  >),

  envName: (assertString: Validator<
    $PropertyType<ValidatedOptions, "envName">,
  >),
};

const BABELRC_VALIDATORS: ValidatorSet = {
  babelrc: (assertBoolean: Validator<
    $PropertyType<ValidatedOptions, "babelrc">,
  >),
  babelrcRoots: (assertBabelrcSearch: Validator<
    $PropertyType<ValidatedOptions, "babelrcRoots">,
  >),
};

const NONPRESET_VALIDATORS: ValidatorSet = {
  extends: (assertString: Validator<
    $PropertyType<ValidatedOptions, "extends">,
  >),
  ignore: (assertIgnoreList: Validator<
    $PropertyType<ValidatedOptions, "ignore">,
  >),
  only: (assertIgnoreList: Validator<$PropertyType<ValidatedOptions, "only">>),

  targets: (assertTargets: Validator<
    $PropertyType<ValidatedOptions, "targets">,
  >),
  browserslistConfigFile: (assertConfigFileSearch: Validator<
    $PropertyType<ValidatedOptions, "browserslistConfigFile">,
  >),
  browserslistEnv: (assertString: Validator<
    $PropertyType<ValidatedOptions, "browserslistEnv">,
  >),
};

const COMMON_VALIDATORS: ValidatorSet = {
  // TODO: Should 'inputSourceMap' be moved to be a root-only option?
  // We may want a boolean-only version to be a common option, with the
  // object only allowed as a root config argument.
  inputSourceMap: (assertInputSourceMap: Validator<
    $PropertyType<ValidatedOptions, "inputSourceMap">,
  >),
  presets: (assertPluginList: Validator<
    $PropertyType<ValidatedOptions, "presets">,
  >),
  plugins: (assertPluginList: Validator<
    $PropertyType<ValidatedOptions, "plugins">,
  >),
  passPerPreset: (assertBoolean: Validator<
    $PropertyType<ValidatedOptions, "passPerPreset">,
  >),
  assumptions: (assertAssumptions: Validator<
    $PropertyType<ValidatedOptions, "assumptions">,
  >),

  env: (assertEnvSet: Validator<$PropertyType<ValidatedOptions, "env">>),
  overrides: (assertOverridesList: Validator<
    $PropertyType<ValidatedOptions, "overrides">,
  >),

  // We could limit these to 'overrides' blocks, but it's not clear why we'd
  // bother, when the ability to limit a config to a specific set of files
  // is a fairly general useful feature.
  test: (assertConfigApplicableTest: Validator<
    $PropertyType<ValidatedOptions, "test">,
  >),
  include: (assertConfigApplicableTest: Validator<
    $PropertyType<ValidatedOptions, "include">,
  >),
  exclude: (assertConfigApplicableTest: Validator<
    $PropertyType<ValidatedOptions, "exclude">,
  >),

  retainLines: (assertBoolean: Validator<
    $PropertyType<ValidatedOptions, "retainLines">,
  >),
  comments: (assertBoolean: Validator<
    $PropertyType<ValidatedOptions, "comments">,
  >),
  shouldPrintComment: (assertFunction: Validator<
    $PropertyType<ValidatedOptions, "shouldPrintComment">,
  >),
  compact: (assertCompact: Validator<
    $PropertyType<ValidatedOptions, "compact">,
  >),
  minified: (assertBoolean: Validator<
    $PropertyType<ValidatedOptions, "minified">,
  >),
  auxiliaryCommentBefore: (assertString: Validator<
    $PropertyType<ValidatedOptions, "auxiliaryCommentBefore">,
  >),
  auxiliaryCommentAfter: (assertString: Validator<
    $PropertyType<ValidatedOptions, "auxiliaryCommentAfter">,
  >),
  sourceType: (assertSourceType: Validator<
    $PropertyType<ValidatedOptions, "sourceType">,
  >),
  wrapPluginVisitorMethod: (assertFunction: Validator<
    $PropertyType<ValidatedOptions, "wrapPluginVisitorMethod">,
  >),
  highlightCode: (assertBoolean: Validator<
    $PropertyType<ValidatedOptions, "highlightCode">,
  >),
  sourceMaps: (assertSourceMaps: Validator<
    $PropertyType<ValidatedOptions, "sourceMaps">,
  >),
  sourceMap: (assertSourceMaps: Validator<
    $PropertyType<ValidatedOptions, "sourceMap">,
  >),
  sourceFileName: (assertString: Validator<
    $PropertyType<ValidatedOptions, "sourceFileName">,
  >),
  sourceRoot: (assertString: Validator<
    $PropertyType<ValidatedOptions, "sourceRoot">,
  >),
  parserOpts: (assertObject: Validator<
    $PropertyType<ValidatedOptions, "parserOpts">,
  >),
  generatorOpts: (assertObject: Validator<
    $PropertyType<ValidatedOptions, "generatorOpts">,
  >),
};
if (!process.env.BABEL_8_BREAKING) {
  Object.assign(COMMON_VALIDATORS, {
    getModuleId: assertFunction,
    moduleRoot: assertString,
    moduleIds: assertBoolean,
    moduleId: assertString,
  });
}

export type InputOptions = ValidatedOptions;

export type ValidatedOptions = {
  cwd?: string,
  filename?: string,
  filenameRelative?: string,
  babelrc?: boolean,
  babelrcRoots?: BabelrcSearch,
  configFile?: ConfigFileSearch,
  root?: string,
  rootMode?: RootMode,
  code?: boolean,
  ast?: boolean,
  cloneInputAst?: boolean,
  inputSourceMap?: RootInputSourceMapOption,
  envName?: string,
  caller?: CallerMetadata,

  extends?: string,
  env?: EnvSet<ValidatedOptions>,
  ignore?: IgnoreList,
  only?: IgnoreList,
  overrides?: OverridesList,

  // Generally verify if a given config object should be applied to the given file.
  test?: ConfigApplicableTest,
  include?: ConfigApplicableTest,
  exclude?: ConfigApplicableTest,

  presets?: PluginList,
  plugins?: PluginList,
  passPerPreset?: boolean,

  assumptions?: { [name: string]: boolean },

  // browserslists-related options
  targets?: TargetsListOrObject,
  browserslistConfigFile?: ConfigFileSearch,
  browserslistEnv?: string,

  // Options for @babel/generator
  retainLines?: boolean,
  comments?: boolean,
  shouldPrintComment?: Function,
  compact?: CompactOption,
  minified?: boolean,
  auxiliaryCommentBefore?: string,
  auxiliaryCommentAfter?: string,

  // Parser
  sourceType?: SourceTypeOption,

  wrapPluginVisitorMethod?: Function,
  highlightCode?: boolean,

  // Sourcemap generation options.
  sourceMaps?: SourceMapsOption,
  sourceMap?: SourceMapsOption,
  sourceFileName?: string,
  sourceRoot?: string,

  // Deprecate top level parserOpts
  parserOpts?: {},
  // Deprecate top level generatorOpts
  generatorOpts?: {},
};

export type NormalizedOptions = {
  ...$Diff<ValidatedOptions, { targets: any }>,
  +targets: Targets,
};

export type CallerMetadata = {
  // If 'caller' is specified, require that the name is given for debugging
  // messages.
  name: string,
};
export type EnvSet<T> = {
  [string]: ?T,
};
export type IgnoreItem = string | Function | RegExp;
export type IgnoreList = $ReadOnlyArray<IgnoreItem>;

export type PluginOptions = {} | void | false;
export type PluginTarget = string | {} | Function;
export type PluginItem =
  | ConfigItem
  | Plugin
  | PluginTarget
  | [PluginTarget, PluginOptions]
  | [PluginTarget, PluginOptions, string | void];
export type PluginList = $ReadOnlyArray<PluginItem>;

export type OverridesList = Array<ValidatedOptions>;
export type ConfigApplicableTest = IgnoreItem | Array<IgnoreItem>;

export type ConfigFileSearch = string | boolean;
export type BabelrcSearch = boolean | IgnoreItem | IgnoreList;
export type SourceMapsOption = boolean | "inline" | "both";
export type SourceTypeOption = "module" | "script" | "unambiguous";
export type CompactOption = boolean | "auto";
export type RootInputSourceMapOption = {} | boolean;
export type RootMode = "root" | "upward" | "upward-optional";

export type TargetsListOrObject =
  | Targets
  | InputTargets
  | $PropertyType<InputTargets, "browsers">;

export type OptionsSource =
  | "arguments"
  | "configfile"
  | "babelrcfile"
  | "extendsfile"
  | "preset"
  | "plugin";

export type RootPath = $ReadOnly<{
  type: "root",
  source: OptionsSource,
}>;
type OverridesPath = $ReadOnly<{
  type: "overrides",
  index: number,
  parent: RootPath,
}>;
type EnvPath = $ReadOnly<{
  type: "env",
  name: string,
  parent: RootPath | OverridesPath,
}>;
export type NestingPath = RootPath | OverridesPath | EnvPath;

export const assumptionsNames = new Set<string>([
  "arrayLikeIsIterable",
  "constantReexports",
  "constantSuper",
  "enumerableModuleMeta",
  "ignoreFunctionLength",
  "ignoreToPrimitiveHint",
  "iterableIsArray",
  "mutableTemplateObject",
  "noClassCalls",
  "noDocumentAll",
  "noNewArrows",
  "objectRestNoSymbols",
  "privateFieldsAsProperties",
  "pureGetters",
  "setClassMethods",
  "setComputedProperties",
  "setPublicClassFields",
  "setSpreadProperties",
  "skipForOfIteratorClosing",
  "superIsCallableConstructor",
]);

function getSource(loc: NestingPath): OptionsSource {
  return loc.type === "root" ? loc.source : getSource(loc.parent);
}

export function validate(type: OptionsSource, opts: {}): ValidatedOptions {
  return validateNested(
    {
      type: "root",
      source: type,
    },
    opts,
  );
}

function validateNested(loc: NestingPath, opts: {}) {
  const type = getSource(loc);

  assertNoDuplicateSourcemap(opts);

  Object.keys(opts).forEach((key: string) => {
    const optLoc = {
      type: "option",
      name: key,
      parent: loc,
    };

    if (type === "preset" && NONPRESET_VALIDATORS[key]) {
      throw new Error(`${msg(optLoc)} is not allowed in preset options`);
    }
    if (type !== "arguments" && ROOT_VALIDATORS[key]) {
      throw new Error(
        `${msg(optLoc)} is only allowed in root programmatic options`,
      );
    }
    if (
      type !== "arguments" &&
      type !== "configfile" &&
      BABELRC_VALIDATORS[key]
    ) {
      if (type === "babelrcfile" || type === "extendsfile") {
        throw new Error(
          `${msg(
            optLoc,
          )} is not allowed in .babelrc or "extends"ed files, only in root programmatic options, ` +
            `or babel.config.js/config file options`,
        );
      }

      throw new Error(
        `${msg(
          optLoc,
        )} is only allowed in root programmatic options, or babel.config.js/config file options`,
      );
    }

    const validator =
      COMMON_VALIDATORS[key] ||
      NONPRESET_VALIDATORS[key] ||
      BABELRC_VALIDATORS[key] ||
      ROOT_VALIDATORS[key] ||
      (throwUnknownError: Validator<void>);

    validator(optLoc, opts[key]);
  });

  return (opts: any);
}

function throwUnknownError(loc: OptionPath) {
  const key = loc.name;

  if (removed[key]) {
    const {
      message,
      version = 5,
    }: { message: string, version?: number } = removed[key];

    throw new Error(
      `Using removed Babel ${version} option: ${msg(loc)} - ${message}`,
    );
  } else {
    // eslint-disable-next-line max-len
    const unknownOptErr = new Error(
      `Unknown option: ${msg(
        loc,
      )}. Check out https://babeljs.io/docs/en/babel-core/#options for more information about options.`,
    );
    // $FlowIgnore
    unknownOptErr.code = "BABEL_UNKNOWN_OPTION";

    throw unknownOptErr;
  }
}

function has(obj: {}, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function assertNoDuplicateSourcemap(opts: {}): void {
  if (has(opts, "sourceMap") && has(opts, "sourceMaps")) {
    throw new Error(".sourceMap is an alias for .sourceMaps, cannot use both");
  }
}

function assertEnvSet(loc: OptionPath, value: mixed): EnvSet<ValidatedOptions> {
  if (loc.parent.type === "env") {
    throw new Error(`${msg(loc)} is not allowed inside of another .env block`);
  }
  const parent: RootPath | OverridesPath = loc.parent;

  const obj = assertObject(loc, value);
  if (obj) {
    // Validate but don't copy the .env object in order to preserve
    // object identity for use during config chain processing.
    for (const envName of Object.keys(obj)) {
      const env = assertObject(access(loc, envName), obj[envName]);
      if (!env) continue;

      const envLoc = {
        type: "env",
        name: envName,
        parent,
      };
      validateNested(envLoc, env);
    }
  }
  return (obj: any);
}

function assertOverridesList(loc: OptionPath, value: mixed): OverridesList {
  if (loc.parent.type === "env") {
    throw new Error(`${msg(loc)} is not allowed inside an .env block`);
  }
  if (loc.parent.type === "overrides") {
    throw new Error(`${msg(loc)} is not allowed inside an .overrides block`);
  }
  const parent: RootPath = loc.parent;

  const arr = assertArray(loc, value);
  if (arr) {
    for (const [index, item] of arr.entries()) {
      const objLoc = access(loc, index);
      const env = assertObject(objLoc, item);
      if (!env) throw new Error(`${msg(objLoc)} must be an object`);

      const overridesLoc = {
        type: "overrides",
        index,
        parent,
      };
      validateNested(overridesLoc, env);
    }
  }
  return (arr: any);
}

export function checkNoUnwrappedItemOptionPairs(
  items: Array<UnloadedDescriptor>,
  index: number,
  type: "plugin" | "preset",
  e: Error,
): void {
  if (index === 0) return;

  const lastItem = items[index - 1];
  const thisItem = items[index];

  if (
    lastItem.file &&
    lastItem.options === undefined &&
    typeof thisItem.value === "object"
  ) {
    e.message +=
      `\n- Maybe you meant to use\n` +
      `"${type}": [\n  ["${lastItem.file.request}", ${JSON.stringify(
        thisItem.value,
        undefined,
        2,
      )}]\n]\n` +
      `To be a valid ${type}, its name and options should be wrapped in a pair of brackets`;
  }
}
