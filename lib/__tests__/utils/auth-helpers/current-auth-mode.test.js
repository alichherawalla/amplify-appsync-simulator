"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const current_auth_mode_1 = require("../../../utils/auth-helpers/current-auth-mode");
const helpers_1 = require("../../../utils/auth-helpers/helpers");
const type_definition_1 = require("../../../type-definition");
jest.mock('../../../utils/auth-helpers/helpers');
describe('getAuthorizationMode', () => {
    const extractHeaderMock = helpers_1.extractHeader;
    const extractJwtTokenMock = helpers_1.extractJwtToken;
    const getAllowedAuthTypesMock = helpers_1.getAllowedAuthTypes;
    const isValidOIDCTokenMock = helpers_1.isValidOIDCToken;
    let API_KEY = 'x-api-key';
    let AUTHORIZATION = 'my-token';
    let APPSYNC_CONFIG;
    beforeEach(() => {
        jest.restoreAllMocks();
        APPSYNC_CONFIG = {
            apiKey: API_KEY,
            name: 'AppSync API',
            defaultAuthenticationType: {
                authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            },
            additionalAuthenticationProviders: [],
        };
        getAllowedAuthTypesMock.mockReturnValue([
            type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
            type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
            type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
        ]);
        extractHeaderMock.mockImplementation((header, key) => {
            switch (key) {
                case 'x-api-key':
                    return API_KEY;
                case 'Authorization':
                    return AUTHORIZATION;
                default:
                    throw new Error(`Unexpected ${JSON.stringify(key)}`);
            }
        });
    });
    describe('API Key', () => {
        it('should return API_KEY auth mode when configured', () => {
            expect(current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toEqual(type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY);
        });
        it('should throw error when API key does not match', () => {
            APPSYNC_CONFIG.apiKey = 'not-default';
            expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid API key');
        });
        it('should throw error when API_KEY is not one of the allowed Auth', () => {
            getAllowedAuthTypesMock.mockReturnValue([type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS]);
            expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
        });
    });
    describe('IAM', () => {
        beforeEach(() => {
            API_KEY = undefined;
        });
        it('should return IAM when Authorization starts with AWS4-HMAC-SHA256', () => {
            AUTHORIZATION = 'AWS4-HMAC-SHA256:actual-key';
            expect(current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toEqual(type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM);
        });
        it('should throw error when the when AuthMode is includes IAM and authorization does not start with AWS4-HMAC-SHA256', () => {
            AUTHORIZATION = 'Not AWS4-HMAC-SHA256:actual-key';
            expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
        });
        it('should throw error when IAM is not in the allowed Authorization', () => {
            getAllowedAuthTypesMock.mockReturnValue([type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS]);
            AUTHORIZATION = 'AWS4-HMAC-SHA256:actual-key';
            expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
        });
    });
    describe('Cognito User Pools', () => {
        beforeEach(() => {
            API_KEY = undefined;
            AUTHORIZATION = 'encoded token goes here';
        });
        it('should return AMAZON_COGNITO_USER_POOLS as authorization mode', () => {
            extractJwtTokenMock.mockReturnValue({
                iss: 'https://cognito-idp.aws.amazon.com',
            });
            expect(current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toEqual(type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS);
        });
        it('should throw error when the issuer does not start with https://cognito-idp.aws', () => {
            extractJwtTokenMock.mockReturnValue({
                iss: 'https://not-cognito-idp.aws.amazon.com',
            });
            expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
        });
        it('should throw error when the COGNITO is not allowed auth type', () => {
            extractJwtTokenMock.mockReturnValue({
                iss: 'https://cognito-idp.aws.amazon.com',
            });
            getAllowedAuthTypesMock.mockReturnValue([type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM]);
            expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
        });
    });
    describe('OpenID Connect', () => {
        let jwtToken;
        beforeEach(() => {
            API_KEY = undefined;
            AUTHORIZATION = 'encoded token goes here';
            jwtToken = {
                iss: 'https://oidc-provider.aws.amazon.com',
            };
            extractJwtTokenMock.mockReturnValue(jwtToken);
        });
        it('should return OIDC as authorization mode', () => {
            isValidOIDCTokenMock.mockReturnValue(true);
            expect(current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toEqual(type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT);
            expect(isValidOIDCTokenMock).toBeCalledWith(jwtToken, [
                APPSYNC_CONFIG.defaultAuthenticationType,
                ...APPSYNC_CONFIG.additionalAuthenticationProviders,
            ]);
        });
        it('should throw error when the JWT token has an issuer which is not in the allowlist', () => {
            isValidOIDCTokenMock.mockReturnValue(false);
            expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
        });
        it('should throw error OIDC is not an allowed auth type', () => {
            isValidOIDCTokenMock.mockReturnValue(true);
            getAllowedAuthTypesMock.mockReturnValue([type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY]);
            expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Invalid JWT token');
        });
    });
    it('should throw error when not auth type matches', () => {
        API_KEY = undefined;
        AUTHORIZATION = undefined;
        expect(() => current_auth_mode_1.getAuthorizationMode({}, APPSYNC_CONFIG)).toThrow('UnauthorizedException: Missing authorization');
    });
});
//# sourceMappingURL=current-auth-mode.test.js.map