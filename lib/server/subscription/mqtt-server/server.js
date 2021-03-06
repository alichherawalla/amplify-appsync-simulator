"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTTServer = void 0;
var mqtt_connection_1 = __importDefault(require("mqtt-connection"));
var ws_1 = __importDefault(require("ws"));
var steed_1 = __importDefault(require("steed"));
var pino_1 = __importDefault(require("pino"));
var lodash_1 = require("lodash");
var nanoid_1 = __importDefault(require("nanoid"));
var trie_listener_1 = require("./trie-listener");
var client_1 = require("./client");
var events_1 = require("events");
var DEFAULT_OPTIONS = {
    maxConnections: 10000000,
    backend: {
        wildcardOne: '+',
        wildcardSome: '#',
    },
    stats: false,
    publishNewClient: true,
    publishClientDisconnect: true,
    publishSubscriptions: true,
    maxInflightMessages: 1024,
    onQoS2publish: 'noack',
    logger: {
        name: 'amplify-mqtt-server',
        level: 'warn',
    },
};
var nop = function () { };
/**
 * The Amplify MQTT Server is a very simple MQTT server that
 * provides a simple event-based API to craft your own MQTT logic
 * It supports QoS 0 & 1, without external storage.
 *
 *
 * Options:
 *  - `host`, the IP address of the server (see http://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback).
 *    that will power this server.
 *  - `maxInflightMessages`, the maximum number of inflight messages per client.
 *  - `logger`, the options for Pino.
 *     A sub-key `factory` is used to specify what persistence
 *     to use.
 *  - `stats`, publish the stats every 10s (default false).
 *  - `publishNewClient`, publish message to topic "$SYS/{broker-id}/new/clients" when new client connects.
 *  - `publishClientDisconnect`, publish message to topic "$SYS/{broker-id}/disconnect/clients" when a client disconnects.
 *  - `publishSubscriptions`, publish message to topic "$SYS/{broker-id}/new/(un)subscribes" when a client subscribes/unsubscribes.
 *
 * Events:
 *  - `clientConnected`, when a client is connected;
 *    the client is passed as a parameter.
 *  - `clientDisconnecting`, when a client is being disconnected;
 *    the client is passed as a parameter.
 *  - `clientDisconnected`, when a client is disconnected;
 *    the client is passed as a parameter.
 *  - `clientError`, when the server identifies a client connection error;
 *    the error and the client are passed as parameters.
 *  - `published`, when a new message is published;
 *    the packet and the client are passed as parameters.
 *  - `subscribed`, when a client is subscribed to a topic;
 *    the topic and the client are passed as parameters.
 *  - `unsubscribed`, when a client is unsubscribed to a topic;
 *    the topic and the client are passed as parameters.
 *
 * @param {Object} opts The option object
 * @param {Function} callback The ready callback
 * @api public
 */
var MQTTServer = /** @class */ (function (_super) {
    __extends(MQTTServer, _super);
    function MQTTServer(options, callback) {
        if (options === void 0) { options = {}; }
        if (callback === void 0) { callback = function (err, data) { }; }
        var _this = _super.call(this) || this;
        _this.callback = callback;
        _this.options = lodash_1.defaultsDeep(options, DEFAULT_OPTIONS);
        _this._dedupId = 0;
        _this.clients = {};
        _this.closed = false;
        _this.closed = false;
        _this.logger = pino_1.default(_this.options.logger);
        _this.onQoS2publish = _this.options.onQoS2publish;
        _this.id = _this.options.id || nanoid_1.default(7);
        new Promise(function (resolve) {
            var listener = new trie_listener_1.TrieListener(_this.options.backend);
            listener.once('ready', function () {
                resolve(listener);
            });
        })
            .then(function (listener) {
            _this.listener = listener;
            _this.init();
        })
            .catch(function (err) {
            callback(err);
        });
        return _this;
    }
    MQTTServer.prototype.init = function () {
        var _this = this;
        this.on('clientConnected', function (client) {
            if (_this.options.publishNewClient) {
                _this.publish({
                    topic: "$SYS/" + _this.id + "/new/clients",
                    payload: client.id,
                });
            }
            _this.clients[client.id] = client;
        });
        this.once('ready', function () {
            _this.callback(null, _this);
        });
        this.on('ready', function () {
            _this.listener.subscribe('$SYS/+/new/clients', function (topic, payload) {
                var serverId = topic.split('/')[1];
                var clientId = payload;
                if (_this.clients[clientId] && serverId !== _this.id) {
                    _this.clients[clientId].close(null, 'new connection request');
                }
            });
        });
        if (this.options.publishSubscriptions) {
            this.on('subscribed', function (topic, client) {
                _this.publish({
                    topic: "$SYS/" + _this.id + "/new/subscribes",
                    payload: JSON.stringify({
                        clientId: client.id,
                        topic: topic,
                    }),
                });
            });
            this.on('unsubscribed', function (topic, client) {
                _this.publish({
                    topic: '$SYS/' + _this.id + '/new/unsubscribes',
                    payload: JSON.stringify({
                        clientId: client.id,
                        topic: topic,
                    }),
                });
            });
        }
        this.on('clientDisconnected', function (client) {
            if (_this.options.publishClientDisconnect) {
                _this.publish({
                    topic: '$SYS/' + _this.id + '/disconnect/clients',
                    payload: client.id,
                });
            }
            delete _this.clients[client.id];
        });
    };
    MQTTServer.prototype.toString = function () {
        return 'AmplifyMQTTServer.Server';
    };
    MQTTServer.prototype.subscribe = function (topic, callback, done) {
        this.listener.subscribe(topic, callback, done);
    };
    MQTTServer.prototype.publish = function (packet, client, callback) {
        var _this = this;
        var logger = this.logger;
        if (typeof client === 'function') {
            callback = client;
            client = null;
        }
        else if (client) {
            logger = client.logger;
        }
        if (!callback) {
            callback = nop;
        }
        var newPacket = {
            topic: packet.topic,
            payload: packet.payload,
            messageId: nanoid_1.default(7),
            qos: packet.qos,
            retain: packet.retain,
        };
        var opts = {
            qos: packet.qos,
            messageId: newPacket.messageId,
        };
        if (client) {
            opts.clientId = client.id;
        }
        if (this.closed) {
            logger.debug({ packet: newPacket }, 'not delivering because we are closed');
            return;
        }
        this.listener.publish(newPacket.topic, newPacket.payload, opts, function () {
            if (newPacket.topic.indexOf('$SYS') >= 0) {
                logger.trace({ packet: newPacket }, 'published packet');
            }
            else {
                logger.debug({ packet: newPacket }, 'published packet');
            }
            _this.emit('published', newPacket, client);
            callback(undefined, newPacket);
        });
    };
    MQTTServer.prototype.close = function (callback) {
        var _this = this;
        if (callback === void 0) { callback = nop; }
        var stuffToClose = [];
        if (this.closed) {
            return callback();
        }
        this.closed = true;
        Object.keys(this.clients).forEach(function (i) {
            stuffToClose.push(_this.clients[i]);
        });
        steed_1.default.each(stuffToClose, function (toClose, cb) {
            try {
                toClose.close(cb, 'server closed');
            }
            catch (e) { }
        }, function () {
            _this.listener.close(function () {
                _this.logger.info('server closed');
                _this.emit('closed');
                callback();
            });
        });
    };
    MQTTServer.prototype.updateOfflinePacket = function (client, originMessageId, packet, callback) {
        if (callback) {
            callback(null, packet);
        }
    };
    MQTTServer.prototype.attachHttpServer = function (server, path) {
        var _this = this;
        var opt = { server: server };
        if (path) {
            opt.path = path;
        }
        var wss = new ws_1.default.Server(opt);
        wss.on('connection', function (socket) {
            var stream = ws_1.default.createWebSocketStream(socket, {});
            var conn = new mqtt_connection_1.default(stream);
            new client_1.Client(conn, _this);
        });
    };
    MQTTServer.prototype.nextDedupId = function () {
        return this._dedupId++;
    };
    return MQTTServer;
}(events_1.EventEmitter));
exports.MQTTServer = MQTTServer;
//# sourceMappingURL=server.js.map