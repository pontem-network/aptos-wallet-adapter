import { Types } from 'aptos';
export declare const payloadV1ToV0: (payload: Types.TransactionPayload) => {
    type: string;
    function: string;
    type_arguments: string[];
    arguments: any[];
};
export declare const timeoutPromise: (timeout: any) => {
    timeoutId: any;
    promise: Promise<void>;
};
//# sourceMappingURL=util.d.ts.map