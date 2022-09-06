import { ref } from 'vue';

export function useSSR() {
  const isClient = ref<boolean>(false);

  if (typeof window !== 'undefined') {
    isClient.value = true;
  }

  return {
    isClient
  };
}
