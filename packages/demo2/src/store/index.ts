import { createPinia, defineStore } from 'pinia'
import { useWalletProviderStore } from "@manahippo/aptos-wallet-adapter";
import { ref, reactive } from 'vue'
import type { IMyItem } from './types'
import { createId } from './utils'
import { PontemWalletAdapter } from "@manahippo/aptos-wallet-adapter";

export const useItemStore = defineStore('item', () => {
  let MyArray = reactive([{ id: createId(), name: 'First Item' }] as IMyItem[])
  let SelectedItem = ref(MyArray[0])
  const AddItem = (n: string) => {
    MyArray.push({ id: createId(), name: n })
  }

  return { MyArray, SelectedItem, AddItem }
})

const wallets = [new PontemWalletAdapter()];

const useStore = useWalletProviderStore();

export default createPinia()
