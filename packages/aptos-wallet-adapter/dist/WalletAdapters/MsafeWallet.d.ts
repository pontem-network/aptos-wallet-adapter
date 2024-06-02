import { MaybeHexString, Types } from 'aptos';
import { AccountKeys, BaseWalletAdapter, NetworkInfo, SignMessagePayload, SignMessageResponse, WalletAdapterNetwork, WalletName, WalletReadyState } from './BaseAdapter';
import { MsafeWallet } from 'msafe-wallet';
export declare const MsafeWalletName: WalletName<"Msafe">;
interface MsafeAccount {
    address: MaybeHexString;
    publicKey: MaybeHexString;
    authKey: MaybeHexString;
    isConnected: boolean;
}
export declare class MsafeWalletAdapter extends BaseWalletAdapter {
    name: WalletName<"Msafe">;
    url: string;
    icon: string;
    protected _provider: MsafeWallet | undefined;
    protected _network: WalletAdapterNetwork;
    protected _chainId: string;
    protected _readyState: WalletReadyState;
    protected _connecting: boolean;
    protected _wallet: MsafeAccount | null;
    constructor(origin?: 'Mainnet' | 'Testnet' | string);
    get publicAccount(): AccountKeys;
    get network(): NetworkInfo;
    get connecting(): boolean;
    get connected(): boolean;
    get readyState(): WalletReadyState;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction(transactionPyld: Types.TransactionPayload, options?: any): Promise<Uint8Array>;
    signAndSubmitTransaction(transactionPyld: Types.TransactionPayload, options?: any): Promise<{
        hash: Types.HexEncodedBytes;
    }>;
    signMessage(msgPayload: SignMessagePayload): Promise<SignMessageResponse>;
    onAccountChange(): Promise<void>;
    onNetworkChange(): Promise<void>;
}
export {};
//# sourceMappingURL=MsafeWallet.d.ts.map