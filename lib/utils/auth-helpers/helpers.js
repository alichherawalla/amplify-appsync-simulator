"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedAuthTypes = exports.extractHeader = exports.isValidOIDCToken = exports.extractJwtToken = void 0;
var jwt_decode_1 = __importDefault(require("jwt-decode"));
var type_definition_1 = require("../../type-definition");
function extractJwtToken(authorization) {
    try {
        return jwt_decode_1.default(authorization);
    }
    catch (_) {
        return undefined;
    }
}
exports.extractJwtToken = extractJwtToken;
function isValidOIDCToken(token, configuredAuthTypes) {
    var oidcIssuers = configuredAuthTypes
        .filter(function (authType) { return authType.authenticationType === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT; })
        .map(function (auth) {
        return auth.openIDConnectConfig.Issuer && auth.openIDConnectConfig.Issuer.endsWith('/')
            ? auth.openIDConnectConfig.Issuer.substring(0, auth.openIDConnectConfig.Issuer.length - 1)
            : auth.openIDConnectConfig.Issuer;
    });
    var tokenIssuer = token.iss.endsWith('/') ? token.iss.substring(0, token.iss.length - 1) : token.iss;
    return oidcIssuers.length > 0 && oidcIssuers.includes(tokenIssuer);
}
exports.isValidOIDCToken = isValidOIDCToken;
function extractHeader(headers, name) {
    var headerName = Object.keys(headers).find(function (header) { return header.toLowerCase() === name.toLowerCase(); });
    var headerValue = headerName && headers[headerName];
    return headerValue ? (Array.isArray(headerValue) ? headerValue[0] : headerValue) : undefined;
}
exports.extractHeader = extractHeader;
function getAllowedAuthTypes(config) {
    return __spreadArrays([config.defaultAuthenticationType], config.additionalAuthenticationProviders).map(function (authType) { return authType.authenticationType; });
}
exports.getAllowedAuthTypes = getAllowedAuthTypes;
//# sourceMappingURL=helpers.js.map