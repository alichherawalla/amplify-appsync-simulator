"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyAppSyncSimulator = exports.removeDataLoader = exports.addDataLoader = void 0;
var graphql_1 = require("graphql");
var slash_1 = __importDefault(require("slash"));
var schema_1 = require("./schema");
var velocity_1 = require("./velocity");
var data_loader_1 = require("./data-loader");
var resolvers_1 = require("./resolvers");
var server_1 = require("./server");
var data_loader_2 = require("./data-loader");
Object.defineProperty(exports, "addDataLoader", { enumerable: true, get: function () { return data_loader_2.addDataLoader; } });
Object.defineProperty(exports, "removeDataLoader", { enumerable: true, get: function () { return data_loader_2.removeDataLoader; } });
var graphql_subscriptions_1 = require("graphql-subscriptions");
var function_1 = require("./resolvers/function");
var pipeline_resolver_1 = require("./resolvers/pipeline-resolver");
var type_definition_1 = require("./type-definition");
var subscriptions_filter_1 = require("./utils/graphql-runner/subscriptions-filter");
__exportStar(require("./type-definition"), exports);
var DEFAULT_SCHEMA = "\ntype Query {\n  noop: String\n}\n";
var AmplifyAppSyncSimulator = /** @class */ (function () {
    function AmplifyAppSyncSimulator(serverConfig) {
        if (serverConfig === void 0) { serverConfig = {
            port: 0,
            wsPort: 0,
        }; }
        this._serverConfig = serverConfig;
        this._pubsub = new graphql_subscriptions_1.PubSub();
        try {
            this._server = new server_1.AppSyncSimulatorServer(serverConfig, this);
        }
        catch (e) {
            console.log('Could not start AppSync mock endpoint');
            console.log(e);
            throw e;
        }
    }
    AmplifyAppSyncSimulator.prototype.reload = function (config) {
        this.init(config);
    };
    AmplifyAppSyncSimulator.prototype.init = function (config) {
        var _this = this;
        var lastMappingTemplates = this.mappingTemplates;
        var lastSchema = this._schema;
        var lastResolverMap = this.resolvers;
        var lastFunctions = this.functions;
        var lastDataSources = this.dataSources;
        try {
            this._appSyncConfig = config.appSync;
            this.mappingTemplates = (config.mappingTemplates || []).reduce(function (map, template) {
                var normalizedTemplate = { content: template.content };
                if (template.path) {
                    // Windows path normalization by replacing '\' with '/' as CFN references path with '/'
                    normalizedTemplate.path = slash_1.default(template.path);
                }
                map.set(normalizedTemplate.path, new velocity_1.VelocityTemplate(normalizedTemplate, _this));
                return map;
            }, new Map());
            this.dataSources = (config.dataSources || []).reduce(function (map, source) {
                var dataLoader = data_loader_1.getDataLoader(source.type);
                map.set(source.name, new dataLoader(source));
                return map;
            }, new Map());
            this.functions = (config.functions || []).reduce(function (map, fn) {
                var dataSourceName = fn.dataSourceName, requestMappingTemplateLocation = fn.requestMappingTemplateLocation, responseMappingTemplateLocation = fn.responseMappingTemplateLocation;
                map.set(fn.name, new function_1.AmplifySimulatorFunction(fn, _this));
                return map;
            }, new Map());
            this.resolvers = (config.resolvers || []).reduce(function (map, resolver) {
                var fieldName = resolver.fieldName;
                var typeName = resolver.typeName;
                var resolveType = resolver.kind;
                var resolveName = typeName + ":" + fieldName;
                var resolverInst = resolveType === type_definition_1.RESOLVER_KIND.PIPELINE
                    ? new pipeline_resolver_1.AppSyncPipelineResolver(resolver, _this)
                    : new resolvers_1.AppSyncUnitResolver(resolver, _this);
                map.set(resolveName, resolverInst);
                return map;
            }, new Map());
            this._schema = schema_1.generateResolvers(new graphql_1.Source(config.schema.content, config.schema.path), config.resolvers, this);
            this._config = config;
        }
        catch (e) {
            this._schema = lastSchema;
            this.resolvers = lastResolverMap;
            this.mappingTemplates = lastMappingTemplates;
            this.dataSources = lastDataSources;
            this.functions = lastFunctions;
            throw e;
        }
    };
    AmplifyAppSyncSimulator.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._server.start()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AmplifyAppSyncSimulator.prototype.stop = function () {
        this._server.stop();
    };
    AmplifyAppSyncSimulator.prototype.getMappingTemplate = function (path) {
        var template = this.mappingTemplates.get(path);
        if (!template) {
            throw new Error("Missing mapping template " + path);
        }
        return template;
    };
    AmplifyAppSyncSimulator.prototype.getDataLoader = function (sourceName) {
        var loader = this.dataSources.get(sourceName);
        if (!loader) {
            throw new Error("Missing data source " + sourceName);
        }
        return loader;
    };
    AmplifyAppSyncSimulator.prototype.getFunction = function (functionName) {
        var fn = this.functions.get(functionName);
        if (!fn) {
            throw new Error("Missing function " + functionName);
        }
        return fn;
    };
    AmplifyAppSyncSimulator.prototype.getResolver = function (typeName, fieldName) {
        return this.resolvers.get(typeName + ":" + fieldName);
    };
    Object.defineProperty(AmplifyAppSyncSimulator.prototype, "schema", {
        get: function () {
            return this._schema;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AmplifyAppSyncSimulator.prototype, "pubsub", {
        get: function () {
            return this._pubsub;
        },
        enumerable: false,
        configurable: true
    });
    AmplifyAppSyncSimulator.prototype.asyncIterator = function (trigger) {
        var _this = this;
        return graphql_subscriptions_1.withFilter(function () { return _this._pubsub.asyncIterator(trigger); }, subscriptions_filter_1.filterSubscriptions)();
    };
    Object.defineProperty(AmplifyAppSyncSimulator.prototype, "url", {
        get: function () {
            return this._server.url.graphql;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AmplifyAppSyncSimulator.prototype, "config", {
        get: function () {
            return this._config;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AmplifyAppSyncSimulator.prototype, "appSyncConfig", {
        get: function () {
            return this._appSyncConfig;
        },
        enumerable: false,
        configurable: true
    });
    return AmplifyAppSyncSimulator;
}());
exports.AmplifyAppSyncSimulator = AmplifyAppSyncSimulator;
//# sourceMappingURL=index.js.map