<template>
  <div class="hello">
    <h1>Welcome to Your Vue.js + TypeScript App</h1>
    <button @click="onConnect">Connect</button>
    <button @click="onDisconnect">Disconnect</button>
    <button @click="onSignAndSubmit">onSignAndSubmit</button>
    <button @click="onSign">onSign</button>

    <p>Connected: {{ connected }}</p>
    <p>Connecting: {{ connecting }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useWalletProviderStore } from "@manahippo/aptos-wallet-adapter";
import {
  MartianWalletAdapter,
  PontemWalletAdapter,
} from "@manahippo/aptos-wallet-adapter";

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
    } = store; // this is methods, they should not break reactivity.

    init({
      wallets,
      localStorageKey: "VueAdapterLocalStorage",
      autoConnect: false,
    });

    const { connected, connecting, account } = storeToRefs(store);
    const address = computed(() => account.value?.address);

    const onConnect = async () => {
      try {
        await connect("Pontem");
      } catch (e) {
        console.log(e);
      } finally {
        console.log("Vue connected", connected.value);
        console.log("Vue address", address.value);
      }
    };

    const onDisconnect = async () => {
      try {
        await disconnect();
        console.log("Vue disconnected", connected.value);
        console.log("Vue address", address.value);
        console.log("Vue account", account.value);
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
        const { hash } = await signAndSubmitTransaction(transactionPayload);
        console.log("transactionHash", hash);
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
