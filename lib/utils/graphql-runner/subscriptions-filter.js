"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterSubscriptions = void 0;
var util_1 = require("util");
var log = console;
function filterSubscriptions(payload, variables) {
    if (payload == null) {
        log.warn('Subscription payload is null; Publishing will be skipped');
        return false;
    }
    var variableEntries = Object.entries(variables || {});
    if (!variableEntries.length) {
        return true;
    }
    // every variable key/value pair must match corresponding payload key/value pair
    var variableResult = variableEntries.every(function (_a) {
        var variableKey = _a[0], variableValue = _a[1];
        return payload[variableKey] === variableValue;
    });
    if (!variableResult) {
        log.warn('Subscription payload did not match variables');
        log.warn('Payload:');
        log.warn(util_1.inspect(payload));
        log.warn('Variables:');
        log.warn(util_1.inspect(variables));
        return false;
    }
    return true;
}
exports.filterSubscriptions = filterSubscriptions;
//# sourceMappingURL=subscriptions-filter.js.map