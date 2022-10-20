import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { useWalletProviderStore } from "@manahippo/aptos-wallet-adapter";
const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
//To solve issue with call store before pinia mounted We should use store here with pinia passed to store
const _store = useWalletProviderStore(pinia);
app.mount("#app");
//# sourceMappingURL=main.js.map
