<script setup>
import { ref, watch } from 'vue'
import { useItemStore } from '../store'

const store = useItemStore()

const name = ref('')
function addItem() {
  store.AddItem(name.value)
}

watch(store.MyArray, (n, o) => {
  console.log('store.MyArray', JSON.stringify(n))
})
</script>

<template>
  <form @submit.prevent="addItem">
    <label>Item name <input v-model="name" /></label>
    <button>Add</button>
  </form>
</template>
