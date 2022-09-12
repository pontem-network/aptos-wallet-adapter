import { ref, watch, readonly } from 'vue';
import { defineStore, createPinia } from 'pinia';
import {
  WalletError,
  Wallet,
  WalletNotSelectedError,
  WalletNotReadyError,
  WalletNotConnectedError
} from '../WalletProviders';
import { AccountKeys, WalletAdapter, WalletName, WalletReadyState } from '../WalletAdapters';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TransactionPayload } from 'aptos/dist/generated';

interface IUseVueWalletProvider {
  wallets: WalletAdapter[];
  onError?: (error: WalletError) => void;
  localStorageKey?: string;
}

let initData: IUseVueWalletProvider;

export const createWalletProviderStore = (initStoreData: IUseVueWalletProvider) => {
  initData = { ...initStoreData };
  return createPinia();
};

export const useWalletProviderStore = defineStore('walletProviderStore', () => {
  const { wallets: adapters, onError, localStorageKey = 'storageKey' } = initData;
  const { useLocalStorageState } = useLocalStorage();
  const [, setWalletName] = useLocalStorageState<WalletName | null>(localStorageKey, null);
  const wallet = ref<Wallet | null>(null);
  const adapter = ref<WalletAdapter | null>(null);
  const account = ref<AccountKeys | null>(null);
  const connected = ref<boolean>(false);
  const connecting = ref<boolean>(false);
  const disconnecting = ref<boolean>(false);
  const isUnloading = ref<boolean>(false);

  // Wrap adapters to conform to the `Wallet` interface
  const wallets = ref<Wallet[]>(
    adapters.map((adpt) => ({
      adapter: adpt,
      readyState: adpt.readyState
    }))
  );

  // Set default state then necessary
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
    for (const wAdapter of adapters) {
      wAdapter.on('readyStateChange', handleReadyStateChange, wAdapter);
    }
    // When adapters dependency changed - cleanUp function runs before body of watcher;
    onCleanup(() => {
      for (const wAdapter of adapters) {
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
    if (!isUnloading.value) (onError || console.error)(error);
    return error;
  }

  // When the adapter changes, disconnect the old one
  watch(adapter, (_oldValue, _newValue, onCleanup) => {
    onCleanup(() => {
      if (adapter.value) adapter.value.disconnect();
    });
  });

  async function connect(walletName: string) {
    if (connecting.value || disconnecting.value || connected.value) return;
    const selectedWallet = wallets.value.find((wAdapter) => wAdapter.adapter.name === walletName);

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
    if (!adapter.value) return setWalletName(null);

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

  async function signAndSubmitTransaction(transaction: TransactionPayload) {
    if (!adapter.value) throw handleError(new WalletNotSelectedError());
    if (!connected.value) throw handleError(new WalletNotConnectedError());
    return await adapter.value.signAndSubmitTransaction(transaction);
  }

  async function signTransaction(transaction: TransactionPayload) {
    if (!adapter.value) throw handleError(new WalletNotSelectedError());
    if (!connected.value) throw handleError(new WalletNotConnectedError());
    return await adapter.value.signTransaction(transaction);
  }

  return {
    wallets,
    wallet,
    account,
    connected,
    connecting: readonly(connecting),
    disconnecting: readonly(disconnecting),
    select: setWalletName,
    connect,
    disconnect,
    signAndSubmitTransaction,
    signTransaction
  };
});
