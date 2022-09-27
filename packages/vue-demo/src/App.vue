<template>
  <div class="hello">
    <h1>Welcome to Your Vue.js + TypeScript App</h1>
    <button @click="onConnect">Connect if autoconnection false</button>
    <button @click="onDisconnect">Disconnect</button>
    <button @click="onSignAndSubmit">onSignAndSubmit</button>
    <button @click="onSign">onSign</button>
    <button @click="onSelect">Select and Connect</button>
    <button v-if="connected" @click="onSignAndSubmit">Sign and Submit</button>

    <p>Auto Connect: {{ autoConnect }}}</p>
    <p>Connected: {{ connected }}</p>
    <p>Connecting: {{ connecting }}</p>
    <p>Address: {{ address }}</p>
    <p>Current Selected Wallet: {{ name }}</p>
    <p v-if="hash">Hash of transaction: {{ hash }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import {
  useWalletProviderStore,
  WalletName,
} from "@manahippo/aptos-wallet-adapter";
import {
  MartianWalletAdapter,
  PontemWalletAdapter,
} from "@manahippo/aptos-wallet-adapter";

const defaultWalletName = "Pontem" as WalletName;
const autoConnect = true;

export default defineComponent({
  name: "App",
  setup() {
    const store = useWalletProviderStore();
    const wallets = [new MartianWalletAdapter(), new PontemWalletAdapter()];
    const {
      init,
      connect,
      disconnect,
      signAndSubmitTransaction,
      signTransaction,
      select,
    } = store; // this is methods, they should not break reactivity.

    init({
      wallets,
      localStorageKey: "VueAdapterLocalStorage",
      autoConnect: autoConnect,
    });

    const { connected, connecting, account, wallet } = storeToRefs(store);
    const address = computed(() => account.value?.address);
    const name = computed(() => wallet.value?.adapter.name);
    const hash = ref<string | null>(null);

    const onSelect = () => {
      select(defaultWalletName);
    };

    const onConnect = async () => {
      try {
        connect();
      } catch (e) {
        console.log(e);
      }
    };

    const onDisconnect = async () => {
      try {
        await disconnect();
      } catch (e) {
        console.log(e);
      }
    };

    const onSignAndSubmit = async () => {
      const transactionPayload = {
        arguments: [address.value?.toString(), "1"],
        function: "0x1::coin::transfer",
        type: "entry_function_payload" as const,
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
      };
      try {
        const response = await signAndSubmitTransaction(transactionPayload);
        console.log("transactionHash", response.hash);
        hash.value = response.hash;
      } catch (e) {
        console.log(e);
      }
    };

    const onSign = async () => {
      const transactionPayload = {
        arguments: [address?.value?.toString(), "1"],
        function: "0x1::coin::transfer",
        type: "entry_function_payload" as const,
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
      };
      try {
        const signedTransaction = await signTransaction(transactionPayload);
        console.log(signedTransaction);
      } catch (e) {
        console.log(e);
      }
    };
    return {
      onConnect,
      onDisconnect,
      onSignAndSubmit,
      onSign,
      connected,
      connecting,
      address,
      onSelect,
      name,
      hash,
      autoConnect,
    };
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
