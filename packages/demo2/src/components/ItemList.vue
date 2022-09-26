<script setup>
import { reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useItemStore } from '../store'

const store = useItemStore()
const { SelectedItem, MyArray } = storeToRefs(store)
const selectedId = ref(SelectedItem.value.id)
const myArray = reactive(store.MyArray)

watch(selectedId, (id) => {
  SelectedItem.value = MyArray.value.find((item) => item.id === id)

  // or
  //store.SelectedItem = store.MyArray.find((item) => item.id === id)
})

// also watching from both components...
watch(store.MyArray, (n, o) => {
  console.log('store.MyArray', JSON.stringify(n))
})
watch(myArray, (n, o) => {
  console.log('myArray', JSON.stringify(n))
})
</script>

<template>
  <pre>SelectedItem: {{ SelectedItem }}</pre>
  <div v-for="item in store.MyArray">
    <label><input type="radio" name="item" :value="item.id" v-model="selectedId" /> {{ item.name }}</label>
  </div>
</template>
