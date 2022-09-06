import { ref } from 'vue';
import { useSSR } from './useSSR';

export const useLocalStorage = () => {
  const { isClient } = useSSR();
  const useLocalStorageState = <T>(
    key: string,
    defaultState: T,
    session?: boolean
  ): [T, (T: any) => void] => {
    let storage: undefined | Storage;
    if (isClient) {
      storage = session ? sessionStorage : localStorage;
    }
    const state = ref(() => {
      try {
        let storedState = storage?.getItem(key);
        if (storedState) {
          return JSON.parse(storedState || '');
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          console.error(error);
        }
      }
      return defaultState;
    });

    const setLocalStorageState = (newState: any) => {
      state.value = newState;
      if (newState === null) {
        storage?.removeItem(key);
      } else {
        storage?.setItem(key, JSON.stringify(newState));
      }
    };

    return [state, setLocalStorageState];
  };

  return { useLocalStorageState };
};
