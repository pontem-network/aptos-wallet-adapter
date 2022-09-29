import {
  TransactionPayload_EntryFunctionPayload
} from "aptos/src/generated/models/TransactionPayload_EntryFunctionPayload";
import {TransactionPayload_ScriptPayload} from "aptos/src/generated/models/TransactionPayload_ScriptPayload";
import {
  TransactionPayload_ModuleBundlePayload
} from "aptos/src/generated/models/TransactionPayload_ModuleBundlePayload";

export { EntryFunctionPayload } from "aptos/src/generated/models/EntryFunctionPayload"

export type TransactionPayload = (TransactionPayload_EntryFunctionPayload | TransactionPayload_ScriptPayload | TransactionPayload_ModuleBundlePayload);

export type HexEncodedBytes = string;
