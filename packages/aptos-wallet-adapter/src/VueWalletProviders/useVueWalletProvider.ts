import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import {
  Wallet,
  WalletError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletNotSelectedError
} from '../WalletProviders';
import { AccountKeys, WalletAdapter, WalletName, WalletReadyState } from '../WalletAdapters';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TransactionPayload } from 'aptos/src/generated';

interface IUseVueWalletProvider {
  wallets: WalletAdapter[];
  onError?: (error: WalletError) => void;
  localStorageKey?: string;
  autoConnect: boolean;
}

export const useWalletProviderStore = defineStore('walletProviderStore', () => {
  const adapters = ref<WalletAdapter[]>([]);
  const localStorageKey = ref<string>('walletName');
  const autoConnect = ref<boolean>(false);
  const onError = ref<((error: WalletError) => void) | undefined>(undefined);

  function init({
    wallets = [],
    onError: onHandleError,
    localStorageKey: lsKey,
    autoConnect: autoConnection
  }: IUseVueWalletProvider) {
    adapters.value = wallets;
    if (lsKey) localStorageKey.value = lsKey;
    if (autoConnection !== undefined) autoConnect.value = autoConnection;
    if (onError) onError.value = onHandleError;

    console.log('inited, adapters.value: ', adapters.value);
  }

  const useLocalStorageState = useLocalStorage();
  const [, setWalletName] = useLocalStorageState<WalletName | null>(localStorageKey.value, null);
  const wallet = ref<Wallet | null>(null);
  const adapter = ref<WalletAdapter | null>(null);
  const account = ref<AccountKeys | null>(null);
  const connected = ref<boolean>(false);
  const connecting = ref<boolean>(false);
  const disconnecting = ref<boolean>(false);
  const isUnloading = ref<boolean>(false);

  // Wrap adapters to conform to the `Wallet` interface
  const wallets = ref<Wallet[]>([]);

  // Sets default state when none of wallets connected
  function setDefaultState() {
    wallet.value = null;
    adapter.value = null;
    account.value = null;
    connected.value = false;
  }

  // When the wallets change, start to listen >for changes to their `readyState`
  watch(adapters, (_value, _oldValue, onCleanup) => {
    function handleReadyStateChange(this: WalletAdapter, isReadyState: WalletReadyState) {
      wallets.value = wallets.value.map((prevWallet) => {
        if (prevWallet.adapter.name === this.name) {
          return { ...prevWallet, isReadyState };
        }
        return prevWallet;
      });
    }
    wallets.value = adapters.value.map((adpt) => ({
      adapter: adpt,
      readyState: adpt.readyState
    }));
    for (const wAdapter of adapters.value) {
      wAdapter.on('readyStateChange', handleReadyStateChange, wAdapter);
    }
    // When adapters dependency changed - cleanUp function runs before body of watcher;
    onCleanup(() => {
      for (const wAdapter of adapters.value) {
        wAdapter.off('readyStateChange', handleReadyStateChange, wAdapter);
      }
    });
  });

  //Handle the adapter's connect event
  function handleConnect() {
    if (!adapter.value) return;
    connected.value = adapter.value.connected;
    account.value = adapter.value.publicAccount;
  }

  // Handle the adapter's disconnect event
  function handleDisconnect() {
    if (!isUnloading.value) setWalletName(null);
    setDefaultState();
  }

  // Handle the adapter's error event, and local errors
  function handleError(error: WalletError) {
    if (!isUnloading.value) (onError.value || console.error)(error);
    return error;
  }

  async function connect(walletName: string) {
    if (connecting.value || disconnecting.value || connected.value) return;
    const selectedWallet = wallets.value.find((wAdapter) => wAdapter.adapter.name === walletName);

    console.log('wallets inside connect', wallets.value);
    if (selectedWallet) {
      wallet.value = selectedWallet;
      adapter.value = selectedWallet.adapter;
      connected.value = selectedWallet.adapter.connected;
      account.value = selectedWallet.adapter.publicAccount;
    } else {
      setDefaultState();
    }

    if (!selectedWallet?.adapter) throw handleError(new WalletNotSelectedError());

    if (
      !(
        selectedWallet.adapter.readyState === WalletReadyState.Installed ||
        selectedWallet.adapter.readyState === WalletReadyState.Loadable
      )
    ) {
      // Clear the selected wallet
      setWalletName(null);
      if (typeof window !== 'undefined' && selectedWallet.adapter.url) {
        window.open(selectedWallet.adapter.url, '_blank');
      }

      throw handleError(new WalletNotReadyError());
    }

    connecting.value = true;
    try {
      await selectedWallet.adapter.connect();
    } catch (error: any) {
      // Clear the selected wallet
      setWalletName(null);
      // Rethrow the error, and handleError will also be called
      throw error;
    } finally {
      connecting.value = false;
      handleConnect();
    }
  }

  async function disconnect() {
    if (disconnecting.value) return;
    if (!adapter.value) {
      setWalletName(null);
      return;
    }

    disconnecting.value = true;
    try {
      await adapter.value.disconnect();
    } catch (error: any) {
      // Clear the selected wallet
      setWalletName(null);
      // Rethrow the error, and handleError will also be called
      throw error;
    } finally {
      disconnecting.value = false;
      handleDisconnect();
    }
  }

  // If autoConnect is enabled, try to connect when the adapter changes and is ready
  watch(adapter, async (_oldValue, _newValue, onCleanup) => {
    if (
      connecting.value ||
      connected.value ||
      !autoConnect.value ||
      !adapter.value ||
      !(
        adapter.value.readyState === WalletReadyState.Installed ||
        adapter.value.readyState === WalletReadyState.Loadable
      )
    )
      return;
    await connect(adapter.value.name);

    // When the adapter changes, disconnect the old one
    onCleanup(() => {
      if (adapter.value) adapter.value.disconnect();
    });
  });

  async function signAndSubmitTransaction(transaction: TransactionPayload, option?: any) {
    if (!adapter.value) throw handleError(new WalletNotSelectedError());
    if (!connected.value) throw handleError(new WalletNotConnectedError());
    return adapter.value.signAndSubmitTransaction(transaction, option);
  }

  async function signTransaction(transaction: TransactionPayload, option?: any) {
    if (!adapter.value) throw handleError(new WalletNotSelectedError());
    if (!connected.value) throw handleError(new WalletNotConnectedError());
    return adapter.value.signTransaction(transaction, option);
  }

  async function signMessage(message: string) {
    if (!adapter.value) throw handleError(new WalletNotSelectedError());
    if (!connected.value) throw handleError(new WalletNotConnectedError());
    return adapter.value.signMessage(message);
  }

  console.log('current Adapter inside Vue wallet:', adapter.value);
  return {
    init,
    wallets,
    wallet,
    account,
    connected,
    connecting,
    disconnecting,
    connect,
    select: setWalletName,
    disconnect,
    signAndSubmitTransaction,
    signTransaction,
    signMessage
  };
});
