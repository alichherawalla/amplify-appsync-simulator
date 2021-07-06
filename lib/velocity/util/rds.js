"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rds = void 0;
exports.rds = {
    toJsonString: function (rdsObject) {
        try {
            rdsObject = JSON.parse(rdsObject);
            var rdsJson = ((rdsObject === null || rdsObject === void 0 ? void 0 : rdsObject.sqlStatementResults) || []).map(function (statement) {
                return ((statement === null || statement === void 0 ? void 0 : statement.records) || []).map(function (record) {
                    var result = {};
                    record.forEach(function (row, index) {
                        result[statement.columnMetadata[index].name] = Object.values(row)[0];
                    });
                    return result;
                });
            });
            return JSON.stringify(rdsJson);
        }
        catch (_a) {
            return '';
        }
    },
};
//# sourceMappingURL=rds.js.map