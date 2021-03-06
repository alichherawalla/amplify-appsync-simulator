"use strict";
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
exports.SubscriptionServer = void 0;
var chalk_1 = __importDefault(require("chalk"));
var crypto_1 = __importDefault(require("crypto"));
var event_to_promise_1 = __importDefault(require("event-to-promise"));
var http_1 = require("http");
var ip_1 = require("ip");
var portfinder_1 = __importDefault(require("portfinder"));
var util_1 = require("util");
var mqtt_server_1 = require("./subscription/mqtt-server");
var MINUTE = 1000 * 60;
var CONNECTION_TIMEOUT = 2 * MINUTE; // 2 mins
var TOPIC_EXPIRATION_TIMEOUT = 60 * MINUTE; // 60 mins
var BASE_PORT = 8900;
var MAX_PORT = 9999;
var log = console;
var SubscriptionServer = /** @class */ (function () {
    function SubscriptionServer(config, appSyncServerContext) {
        this.config = config;
        this.appSyncServerContext = appSyncServerContext;
        this.port = config.wsPort;
        this.mqttWebSocketServer = http_1.createServer();
        this.mqttServer = new mqtt_server_1.MQTTServer({
            logger: {
                level: process.env.DEBUG ? 'debug' : 'error',
            },
        });
        this.mqttServer.attachHttpServer(this.mqttWebSocketServer);
        this.clientRegistry = new Map();
        this.mqttIteratorTimeout = new Map();
        this.mqttServer.on('clientConnected', this.afterMQTTClientConnect.bind(this));
        this.mqttServer.on('clientDisconnected', this.afterMQTTClientDisconnect.bind(this));
        this.mqttServer.on('subscribed', this.afterSubscription.bind(this));
        this.mqttServer.on('unsubscribed', this.afterMQTTClientUnsubscribe.bind(this));
        this.realtimeSocketServer = http_1.createServer();
    }
    SubscriptionServer.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, e_1, server;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.port) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, portfinder_1.default.getPortPromise({
                                startPort: BASE_PORT,
                                stopPort: MAX_PORT,
                            })];
                    case 1:
                        _a.port = _b.sent();
                        return [3 /*break*/, 5];
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, portfinder_1.default.getPortPromise({
                                startPort: this.port,
                                stopPort: this.port,
                                port: this.port,
                            })];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _b.sent();
                        throw new Error("Port " + this.port + " is already in use. Please kill the program using this port and restart Mock");
                    case 5:
                        server = this.mqttWebSocketServer.listen(this.port);
                        return [4 /*yield*/, event_to_promise_1.default(server, 'listening').then(function () {
                                var address = server.address();
                                _this.url = "ws://" + ip_1.address() + ":" + address.port + "/";
                                return server;
                            })];
                    case 6: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    SubscriptionServer.prototype.stop = function () {
        if (this.mqttWebSocketServer) {
            this.mqttWebSocketServer.close();
            this.url = null;
            this.mqttWebSocketServer = null;
        }
    };
    SubscriptionServer.prototype.afterMQTTClientConnect = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var clientId, timeout;
            return __generator(this, function (_a) {
                clientId = client.id;
                log.info("Client (" + chalk_1.default.bold(clientId) + ") connected to subscription server");
                timeout = this.mqttIteratorTimeout.get(client.id);
                if (timeout) {
                    clearTimeout(timeout);
                }
                return [2 /*return*/];
            });
        });
    };
    SubscriptionServer.prototype.afterSubscription = function (topic, client) {
        return __awaiter(this, void 0, void 0, function () {
            var clientId, regs, reg, asyncIterator, topicId, payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clientId = client.id;
                        log.info("Client (" + chalk_1.default.bold(clientId) + ") subscribed to topic " + topic);
                        regs = this.clientRegistry.get(clientId);
                        if (!regs) {
                            log.error("No registration for client (" + chalk_1.default.bold(clientId) + ")");
                            return [2 /*return*/];
                        }
                        reg = regs.find(function (_a) {
                            var topicId = _a.topicId;
                            return topicId === topic;
                        });
                        if (!reg) {
                            log.error("Client (" + chalk_1.default.bold(clientId) + ") tried to subscribe to non-existent topic " + topic);
                            return [2 /*return*/];
                        }
                        asyncIterator = reg.asyncIterator, topicId = reg.topicId;
                        if (!reg.isRegistered) {
                            // turn the subscription back on
                            this.register(reg.document, reg.variables, reg.context, asyncIterator);
                        }
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 3];
                        return [4 /*yield*/, asyncIterator.next()];
                    case 2:
                        payload = (_a.sent()).value;
                        log.info("Publishing payload for topic " + topicId);
                        log.log('Payload:');
                        log.log(util_1.inspect(payload));
                        this.mqttServer.publish({
                            topic: topicId,
                            payload: JSON.stringify(payload),
                            qos: 0,
                            retain: false,
                        });
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SubscriptionServer.prototype.afterMQTTClientUnsubscribe = function (topic, client) {
        var clientId = client.id;
        log.info("Client (" + chalk_1.default.bold(clientId) + ") unsubscribed from topic " + topic);
        var registration = this.clientRegistry.get(clientId);
        if (!registration) {
            log.error("No registration for client (" + chalk_1.default.bold(clientId) + ")");
            return;
        }
        var reg = registration.find(function (_a) {
            var topicId = _a.topicId;
            return topicId === topic;
        });
        if (!reg) {
            log.error("Client (" + chalk_1.default.bold(clientId) + ") tried to unsubscribe from non-existent topic " + topic);
            return;
        }
        // turn off subscription, but keep registration so client
        // can resubscribe
        reg.asyncIterator.return();
        reg.isRegistered = false;
    };
    SubscriptionServer.prototype.afterMQTTClientDisconnect = function (client) {
        var clientId = client.id;
        log.info("Client (" + chalk_1.default.bold(clientId) + ") disconnected");
        var reg = this.clientRegistry.get(clientId);
        if (!reg) {
            log.error("Unregistered client (" + chalk_1.default.bold(clientId) + ") disconnected");
        }
        // kill all the subscriptions as the client has already disconnected
        reg.forEach(function (subscription) {
            subscription.asyncIterator.return();
        });
        this.clientRegistry.delete(clientId);
    };
    SubscriptionServer.prototype.register = function (document, variables, context, asyncIterator) {
        return __awaiter(this, void 0, void 0, function () {
            var connection, remoteAddress, clientId, subscriptionName, paramHash, topicId, registration, currentRegistrations, existingSubscription;
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                connection = context.request.connection;
                remoteAddress = connection.remoteAddress + ":" + connection.remotePort;
                clientId = crypto_1.default
                    .createHash('MD5')
                    .update(remoteAddress)
                    .digest()
                    .toString('hex');
                subscriptionName = document.definitions[0].selectionSet.selections.find(function (s) { return s.kind === 'Field'; }).name.value;
                paramHash = variables && Object.keys(variables).length
                    ? crypto_1.default
                        .createHash('MD5')
                        .update(JSON.stringify(variables))
                        .digest()
                        .toString('hex')
                    : null;
                topicId = [clientId, subscriptionName, paramHash].join('/');
                log.info("Client (" + chalk_1.default.bold(clientId) + ") registered for topic " + topicId);
                registration = {
                    context: context,
                    document: document,
                    variables: variables,
                    topicId: topicId,
                    asyncIterator: asyncIterator,
                    isRegistered: true,
                };
                currentRegistrations = this.clientRegistry.get(clientId) || [];
                existingSubscription = currentRegistrations.find(function (reg) { return reg.topicId === topicId; });
                if (!existingSubscription) {
                    // New subscription request
                    currentRegistrations.push(registration);
                    this.clientRegistry.set(clientId, currentRegistrations);
                    // if client does not connect within this amount of time then end iterator.
                    this.mqttIteratorTimeout.set(clientId, setTimeout(function () {
                        asyncIterator.return();
                        _this.mqttIteratorTimeout.delete(clientId);
                    }, CONNECTION_TIMEOUT));
                }
                else {
                    // reusing existing subscription. Client unsubscribed to the topic earlier but
                    // the socket connection is still present
                    // No timeout needed as client is already connected
                    Object.assign(existingSubscription, registration);
                }
                return [2 /*return*/, {
                        extensions: {
                            subscription: {
                                mqttConnections: [
                                    {
                                        url: this.url,
                                        topics: currentRegistrations.map(function (reg) { return reg.topicId; }),
                                        client: clientId,
                                    },
                                ],
                                newSubscriptions: (_a = {},
                                    _a[subscriptionName] = {
                                        topic: topicId,
                                        expireTime: Date.now() + TOPIC_EXPIRATION_TIMEOUT,
                                    },
                                    _a),
                            },
                        },
                    }];
            });
        });
    };
    return SubscriptionServer;
}());
exports.SubscriptionServer = SubscriptionServer;
//# sourceMappingURL=subscription.js.map