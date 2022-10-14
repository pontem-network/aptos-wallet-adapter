<template>
  <div class="hello">
    <h1>Welcome to Your Vue.js + TypeScript App</h1>
    <div v-if="!connected" className="wallets__group">
      <h3>Select wallet</h3>
      <div
        v-for="item in walletAdapters"
        v-bind:key="item.name"
        className="wallets"
      >
        <input
          type="radio"
          v-bind:value="item.name"
          v-model="walletName"
          v-bind:id="item.name"
        />
        <label v-bind:for="item.name">{{ item.name }}</label>
      </div>
    </div>

    <div className="buttons__group">
      <button v-if="!autoConnect" v-on:click="onConnect">
        Connect if autoconnection false
      </button>
      <button v-if="connected" v-on:click="onDisconnect">Disconnect</button>
      <button v-if="!connected" v-on:click="onSelect">
        Select and Connect
      </button>
      <button v-if="connected" v-on:click="onSign">onSign</button>
      <button v-if="connected" v-on:click="onSignAndSubmit">
        Sign and Submit
      </button>
      <button v-if="connected" v-on:click="onSignMessage">SignMessage</button>
    </div>

    <div className="info">
      <p>Current Selected Wallet: {{ walletName }}</p>
      <p>Auto Connect: {{ autoConnect }}</p>
      <p>Connected: {{ connected }}</p>
      <p>Connecting: {{ connecting }}</p>
      <p v-if="address">Address: {{ address }}</p>
      <p v-if="publicKey">Public Key: {{ publicKey }}</p>
      <p v-if="networkName">Current network: {{ networkName }}</p>
      <p v-if="chainId">Chain ID: {{ chainId }}</p>
      <br />
      <p v-if="signedMessageSignature">
        Signed signature: {{ signedMessageSignature }}
      </p>
      <p v-if="hash">Hash of transaction: {{ hash }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref, defineComponent, watch } from "vue";
import {
  AptosWalletAdapter,
  MartianWalletAdapter,
  PontemWalletAdapter,
  RiseWalletAdapter,
  useWalletProviderStore,
  WalletName,
} from "@manahippo/aptos-wallet-adapter";

const autoConnect = true;
const handleError = (error: any) => {
  /* some fancy notify error callback or just console.log handle */
  console.log(error);
};

export default defineComponent({
  name: "App",
  setup: function () {
    const store = useWalletProviderStore();
    const walletAdapters = [
      new PontemWalletAdapter(),
      new MartianWalletAdapter(),
      new AptosWalletAdapter(),
      new RiseWalletAdapter(),
    ];

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
      wallets: walletAdapters,
      localStorageKey: "VueAdapterLocalStorage",
      autoConnect: autoConnect,
      onError: handleError,
    });

    const { connected, connecting, account, network, wallet } =
      storeToRefs(store); // All const's from store should be extracted with storeToRefs:

    const address = computed(() => account.value?.address);
    const publicKey = computed(() => account.value?.publicKey);
    const hash = ref<string | null>(null);
    const walletName = ref<WalletName | null>(null);
    const networkName = computed(() => network.value?.name);
    const chainId = computed(() => network.value?.chainId);
    const signedMessageSignature = ref<string | null>(null);

    watch([wallet, connected], () => {
      if (wallet.value?.adapter.name) {
        walletName.value = wallet.value.adapter.name;
      } else if (!connected.value) {
        setDefault();
      }
    });

    const setDefault = () => {
      hash.value = null;
      walletName.value = null;
      signedMessageSignature.value = null;
    };

    const onSelect = async () => {
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
        setDefault();
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
      const options = {
        max_gas_amount: "10000",
        gas_unit_price: "1000",
        expiration_timestamp_secs: new Date().getTime().toString(),
      };
      try {
        const response = await signAndSubmitTransaction(
          transactionPayload,
          options
        );
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
        if (typeof signedMessage === "string") {
          signedMessageSignature.value = signedMessage;
        } else if (typeof signedMessage === "object") {
          signedMessageSignature.value = signedMessage.signature;
        }
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
      onSelect,
      connected,
      connecting,
      address,
      networkName,
      walletName,
      publicKey,
      chainId,
      hash,
      autoConnect,
      walletAdapters,
      signedMessageSignature,
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

.wallets__group {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.wallets {
  display: flex;
  max-width: 125px;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
}
</style>
