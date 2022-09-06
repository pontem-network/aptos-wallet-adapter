import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { WalletError, Wallet } from '../WalletProviders';
import { AccountKeys, WalletAdapter, WalletName, WalletReadyState } from '../WalletAdapters';
import { useLocalStorage } from './hooks/useLocalStorage';

interface IUseVueWalletProvider {
  wallets: WalletAdapter[];
  onError?: (error: WalletError) => void;
  localStorageKey?: string;
}

export const useWalletProviderStore = ({
  wallets: adapters,
  onError,
  localStorageKey = 'walletName'
}: IUseVueWalletProvider) =>
  defineStore('walletProviderStore', () => {
    const { useLocalStorageState } = useLocalStorage();
    const wallet = ref<Wallet | null>(null);
    const adapter = ref<WalletAdapter | null>(null);
    const account = ref<AccountKeys | null>(null);
    const connected = ref<boolean>(false);
    const readyState = adapter.value?.readyState || WalletReadyState.Unsupported;
    const connecting = ref<boolean>(false);
    const disconnecting = ref<boolean>(false);
    const isConnecting = ref<boolean>(false);
    const isDisconnecting = ref<boolean>(false);
    const isUnloading = ref<boolean>(false);

    // Wrap adapters to conform to the `Wallet` interface
    const wallets = ref<Wallet[]>(
      adapters.map((adpt) => ({
        adapter: adpt,
        readyState: adpt.readyState
      }))
    );

    // When the wallets change, start to listen for changes to their `readyState`
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

    const [, setWalletName] = useLocalStorageState<WalletName | null>(localStorageKey, null);

    //Handle the adapter's connect event
    function handleConnect() {
      if (!adapter.value) return;
      connected.value = adapter.value.connected;
      account.value = adapter.value.publicAccount;
    }

    // Handle the adapter's disconnect event
    function handleDisconnect() {
      if (!isUnloading.value) setWalletName(null);
      wallet.value = null;
      adapter.value = null;
      account.value = null;
      connected.value = false;
    }

    // Handle the adapter's error event, and local errors
    function handleError(error: WalletError) {
      if (!isUnloading.value) (onError || console.error)(error);
      return error;
    }

    // Setup and teardown event listeners when the adapter changes
    watch(
      [adapter, handleError, handleConnect, handleDisconnect],
      (_oldValue, _newValue, onCleanup) => {
        if (adapter.value) {
          adapter.value.on('connect', handleConnect);
          adapter.value.on('disconnect', handleDisconnect);
          adapter.value.on('error', handleError);
        }
        // When adapters dependency changed - cleanUp function runs before body of watcher;
        onCleanup(() => {
          if (adapter.value) {
            adapter.value.off('connect', handleConnect);
            adapter.value.off('disconnect', handleDisconnect);
            adapter.value.off('error', handleError);
          }
        });
      }
    );

    // When the adapter changes, disconnect the old one
    watch(adapter, (_oldValue, _newValue, onCleanup) => {
      onCleanup(() => {
        if (adapter.value) adapter.value.disconnect();
      });
    });

    async function connect() {}
  });
