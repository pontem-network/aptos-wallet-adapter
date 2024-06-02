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
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutPromise = exports.payloadV1ToV0 = void 0;
const payloadV1ToV0 = (payload) => {
    const v1 = payload;
    return {
        type: 'script_function_payload',
        function: v1.function,
        type_arguments: v1.type_arguments,
        arguments: v1.arguments
    };
};
exports.payloadV1ToV0 = payloadV1ToV0;
const timeoutPromise = (timeout) => {
    let timeoutId;
    const promise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            reject('timeout');
        }), timeout);
    });
    return {
        timeoutId,
        promise
    };
};
exports.timeoutPromise = timeoutPromise;
//# sourceMappingURL=util.js.map