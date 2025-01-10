import { get } from 'lodash-es';
import { ref, watch } from 'vue';

export const useSelect = <T>(arr: T[], defaultItem: T, options: {
  valueKey: string,
  labelKey: string
} = {
  valueKey: 'value',
  labelKey: 'label'
})=> {
  // const currentOption = ref<T | undefined>(defaultItem);
  const currentIndex = ref<number>(0);

  watch(()=> arr, (value)=> {
    console.log(value, '...');
    const index = value.findIndex(item => (item as any)[options.valueKey] === get(defaultItem, options.valueKey));
    if (index > -1) {
      currentIndex.value = index;
    }else{
      currentIndex.value = 0;
    }
  })

  const currentOption = computed(() => {
    return arr[currentIndex.value];
  })

  const prev = () => {
    if(currentIndex.value > 0){
      currentIndex.value--;
    }else{
      currentIndex.value = arr.length - 1;
    }
  }

  const next = () => {
    if(currentIndex.value < arr.length - 1){
      currentIndex.value++;
    }else{
      currentIndex.value = 0;
    }
  }
  return {
    prev,
    next,
    currentIndex,
    currentOption
  }
}
