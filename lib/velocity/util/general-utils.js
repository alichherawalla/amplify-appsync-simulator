"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalUtils = void 0;
var errors_1 = require("./errors");
var v4_1 = __importDefault(require("uuid/v4"));
var string_1 = require("../value-mapper/string");
var array_1 = require("../value-mapper/array");
var map_1 = require("../value-mapper/map");
var js_string_escape_1 = __importDefault(require("js-string-escape"));
exports.generalUtils = {
    errors: [],
    quiet: function () { return ''; },
    qr: function () { return ''; },
    escapeJavaScript: function (value) {
        return js_string_escape_1.default(value);
    },
    urlEncode: function (value) {
        // Stringent in adhering to RFC 3986 ( except the asterisk that appsync ingores to encode )
        return encodeURIComponent(value).replace(/[!'()]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
    },
    urlDecode: function (value) {
        return decodeURIComponent(value);
    },
    base64Encode: function (value) {
        // eslint-disable-next-line
        return new Buffer(value).toString('base64');
    },
    base64Decode: function (value) {
        // eslint-disable-next-line
        return new Buffer(value, 'base64').toString('ascii');
    },
    parseJson: function (value) {
        return JSON.parse(value);
    },
    toJson: function (value) {
        return value !== undefined ? JSON.stringify(value) : JSON.stringify(null);
    },
    autoId: function () {
        return v4_1.default();
    },
    unauthorized: function () {
        var err = new errors_1.Unauthorized('Unauthorized', this.info);
        this.errors.push(err);
        throw err;
    },
    error: function (message, type, data, errorInfo) {
        if (type === void 0) { type = null; }
        if (data === void 0) { data = null; }
        if (errorInfo === void 0) { errorInfo = null; }
        data = filterData(this.info, data);
        var err = new errors_1.TemplateSentError(message, type, data, errorInfo, this.info);
        this.errors.push(err);
        throw err;
    },
    appendError: function (message, type, data, errorInfo) {
        if (type === void 0) { type = null; }
        if (data === void 0) { data = null; }
        if (errorInfo === void 0) { errorInfo = null; }
        data = filterData(this.info, data);
        this.errors.push(new errors_1.TemplateSentError(message, type, data, errorInfo, this.info));
        return '';
    },
    getErrors: function () {
        return this.errors;
    },
    validate: function (allGood, message, errorType, data) {
        if (allGood)
            return '';
        var error = new errors_1.ValidateError(message, this.info, errorType, data);
        this.errors.push(error);
        throw error;
    },
    isNull: function (value) {
        return value === null || typeof value == 'undefined';
    },
    isNullOrEmpty: function (value) {
        if (this.isNull(value))
            return true;
        if (value instanceof map_1.JavaMap) {
            return Object.keys(value.toJSON()).length == 0;
        }
        if (value instanceof array_1.JavaArray || value instanceof string_1.JavaString) {
            return value.toJSON().length == 0;
        }
        return !!value;
    },
    isNullOrBlank: function (value) {
        return this.isNullOrEmpty(value);
    },
    defaultIfNull: function (value, defaultValue) {
        if (defaultValue === void 0) { defaultValue = ''; }
        if (value !== null && value !== undefined)
            return value;
        return defaultValue;
    },
    defaultIfNullOrEmpty: function (value, defaultValue) {
        if (value)
            return value;
        return defaultValue;
    },
    defaultIfNullOrBlank: function (value, defaultValue) {
        if (value)
            return value;
        return defaultValue;
    },
    isString: function (value) {
        return value instanceof string_1.JavaString;
    },
    isNumber: function (value) {
        return typeof value === 'number';
    },
    isBoolean: function (value) {
        return typeof value === 'boolean';
    },
    isList: function (value) {
        return Array.isArray(value) || value instanceof array_1.JavaArray;
    },
    isMap: function (value) {
        if (value instanceof Map)
            return value;
        return value != null && typeof value === 'object';
    },
    typeOf: function (value) {
        if (value === null)
            return 'Null';
        if (this.isList(value))
            return 'List';
        if (this.isMap(value))
            return 'Map';
        switch (typeof value) {
            case 'number':
                return 'Number';
            case 'string':
                return 'String';
            case 'boolean':
                return 'Boolean';
            default:
                return 'Object';
        }
    },
    matches: function (pattern, value) {
        return new RegExp(pattern).test(value);
    },
};
function filterData(info, data) {
    if (data === void 0) { data = null; }
    if (data instanceof map_1.JavaMap) {
        var filteredData = {};
        // filter fields in data based on the query selection set
        info.operation.selectionSet.selections
            .map(function (selection) { return selection; })
            .find(function (selection) { return selection.name.value === info.fieldName; })
            .selectionSet.selections.map(function (fieldNode) { return fieldNode.name.value; })
            .forEach(function (field) { return (filteredData[field] = data.get(field)); });
        data = filteredData;
    }
    return data;
}
//# sourceMappingURL=general-utils.js.map