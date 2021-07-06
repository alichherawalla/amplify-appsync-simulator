"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformUtils = void 0;
var dynamodb_filter_1 = require("./dynamodb-filter");
exports.transformUtils = {
    toDynamoDBConditionExpression: function (condition) {
        var result = dynamodb_filter_1.generateFilterExpression(condition.toJSON());
        return JSON.stringify({
            expression: result.expressions.join(' ').trim(),
            expressionNames: result.expressionNames,
        });
    },
    toDynamoDBFilterExpression: function (filter) {
        var result = dynamodb_filter_1.generateFilterExpression(filter.toJSON());
        return JSON.stringify({
            expression: result.expressions.join(' ').trim(),
            expressionNames: result.expressionNames,
            expressionValues: result.expressionValues,
        });
    },
};
//# sourceMappingURL=index.js.map