<template>
  <div class="hello">
    <h1>Welcome to Your Vue.js + TypeScript App</h1>
    <h3>Select wallet</h3>
    <div v-for="item in wallets" v-bind:key="item.name">
      {{ item.name }}
      <input type="radio" :value="item.name" v-model="walletName" />
    </div>
    <button v-if="!autoConnect" @click="onConnect">
      Connect if autoconnection false
    </button>
    <button @click="onDisconnect">Disconnect</button>
    <button @click="onSelect">Select and Connect</button>
    <button v-if="connected" @click="onSign">onSign</button>
    <button v-if="connected" @click="onSignAndSubmit">Sign and Submit</button>
    <button v-if="connected" @click="onSignMessage">Sign and Submit</button>

    <p>Auto Connect: {{ autoConnect }}</p>
    <p>Connected: {{ connected }}</p>
    <p>Connecting: {{ connecting }}</p>
    <p>Address: {{ address }}</p>
    <p>Current Selected Wallet: {{ walletName }}</p>
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

const defaultWalletName = "Pontem" as WalletName<"Pontem">;
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
      signMessage,
    } = store; // this is methods, they should not break reactivity.

    init({
      wallets,
      localStorageKey: "VueAdapterLocalStorage",
      autoConnect: autoConnect,
    });

    const { connected, connecting, account } = storeToRefs(store);
    const address = computed(() => account.value?.address);
    const hash = ref<string | null>(null);
    const walletName = ref<WalletName>(defaultWalletName);

    const onSelect = () => {
      select(walletName.value);
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

    const onSignMessage = async () => {
      const transactionPayload = {
        message: "some message",
        nonce: "12323131",
      };
      try {
        const signedMessage = await signMessage(transactionPayload);
        console.log("signedMessage", signedMessage);
      } catch (e) {
        console.log("signedMessage error", e);
      }
    };

    return {
      onConnect,
      onDisconnect,
      onSignAndSubmit,
      onSign,
      onSignMessage,
      connected,
      connecting,
      address,
      onSelect,
      walletName,
      hash,
      autoConnect,
      wallets,
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
