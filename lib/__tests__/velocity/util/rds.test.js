"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockInfo = void 0;
const index_1 = require("../../../velocity/util/index");
const mock_data_1 = require("./mock-data");
const stubInfo = {};
exports.mockInfo = stubInfo;
var util;
beforeEach(() => {
    util = index_1.create(undefined, undefined, exports.mockInfo);
});
describe('$utils.rds.toJsonString', () => {
    it('should convert rds object to stringified JSON', () => {
        expect(util.rds.toJsonString(mock_data_1.mockedInputToRdsJsonString)).toEqual(mock_data_1.mockedOutputFromRdsJsonString);
    });
    it('handle input without sqlStatementResults input', () => {
        expect(util.rds.toJsonString('{}')).toEqual('[]');
    });
    it('handle invalid input', () => {
        expect(util.rds.toJsonString('')).toEqual('');
    });
});
//# sourceMappingURL=rds.test.js.map