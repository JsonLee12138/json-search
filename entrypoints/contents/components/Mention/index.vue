<template>
  <div ref="containerRef" class="mention-container bg-stone-100" :style="containerStyle">
    <el-input @input="handleInput" :model-value="modelValue?.value" ref="inputRef" @keydown.enter="handleEnter"
      placeholder="请输入">
      <template #prepend>
        <div class="cursor-pointer" @click="handleOpenOptions">
          <img v-if="icon && currentOption?.icon" :src="currentOption.icon" alt="" width="18" height="18"
            class="rounded inline align-middle">
          <span v-else>{{ currentOption?.label }}</span>
        </div>
      </template>
    </el-input>
    <!-- TODO: 后期扩展 tag 处理 -->
    <!-- <div class="w-full h-[40px] flex input-container"> -->
    <!-- <div class="prepend">
      <div class="cursor-pointer" @click="handleOpenOptions">
        <img v-if="icon && currentOption?.icon" :src="currentOption.icon" alt="" width="18" height="18"
          class="rounded inline align-middle">
        <span v-else>{{ currentOption?.label }}</span>
      </div>
    </div>
    <div class="input-main" contenteditable ref="inputRef" @input="handleInput"></div> -->
  </div>
  <!-- </div> -->
  <div class="py-3 px-2 shadow fixed z-[1000] bg-white rounded-md" :style="optionContainerStyles"
    :class="{ 'hidden': !showOptions }">
    <ul class="list-none options-container">
      <li v-for="item in optionsUse" :key="`option-${item.value}`" :class="{
        'active': modelValue?.prepend === item.value
      }" tabindex="0" @click="handleSelect(item)" @keydown.enter="handleSelect(item)" ref="optionRefs">
        <img :src="item.icon" width="18" height="18" alt="" class="rounded-full" v-if="icon && item.icon">
        <span>{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup generic="T = DefaultSelectOption">
import { get } from 'lodash-es';
import { type DefaultSelectOption, MentionRef, MentionValue, type SelectOptionUse } from './type';
import { ElInput } from 'element-plus';
const props = withDefaults(defineProps<{
  options: T[]
  modelValue?: MentionValue,
  labelKey?: string,
  valueKey?: string,
  iconKey?: string,
  icon?: boolean
  containerStyle?: string | Record<string, string>,
}>(), {
  labelKey: 'label',
  valueKey: 'value',
  iconKey: 'icon'
});

let currentFocusIndex = 0;
const emit = defineEmits(['update:modelValue', 'enter', 'select']);
const containerRef = ref<HTMLInputElement>();
const optionRefs = ref<HTMLLIElement[]>([]);
const inputRef = ref<typeof ElInput | null>(null);
const showOptions = ref(false);
const activeIndex = computed(() => {
  return optionsAll.value.findIndex(item => item.value === props.modelValue?.prepend);
});
const currentOption = computed(() => {
  return optionsAll.value[activeIndex.value];
});

const containerStyles = computed(() => {
  if (!containerRef.value) return null;
  return {
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
    left: containerRef.value.offsetLeft,
    top: containerRef.value.offsetTop,
  };
})

const optionContainerStyles = computed(() => {
  if (!containerStyles.value) return null;
  return {
    width: `${containerStyles.value.width}px`,
    left: `${containerStyles.value.left}px`,
    top: `${containerStyles.value.top + containerStyles.value.height + 4}px`,
  }
})

const optionsAll = computed<SelectOptionUse<T>[]>(() => {
  return props.options.map((item) => ({
    ...item,
    label: get(item, props.labelKey),
    value: get(item, props.valueKey),
    icon: get(item, props.iconKey),
  }));
});

const optionsUse = computed<SelectOptionUse<T>[]>(() => {
  if (showOptions.value && props.modelValue?.value) {
    const valueArr = props.modelValue.value.split(' ').filter(Boolean);
    const prepend = valueArr.shift();
    if (prepend?.startsWith('@')) {
      return optionsAll.value.filter(item => item.value.includes(prepend.slice(1)) || item.label.includes(prepend.slice(1)));
    }
  }
  return optionsAll.value;
});

const handleInput = (value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    value,
  });
  const arr = value.split(' ');
  if (arr.length === 1 && value.startsWith('@')) {
    showOptions.value = true;
  } else {
    showOptions.value = false;
  }
}

const handleEnter = (e: KeyboardEvent | Event) => {
  if (!(e as KeyboardEvent).isComposing) {
    emit('enter', props.modelValue);
  }
}

// TODO: 后期扩展 tag 处理
// const handleSpace = (e: KeyboardEvent) => {
//   const value = (e.target as HTMLInputElement).value;
//   requestAnimationFrame(() => {
//     const valueArr = value.split(' ');
//     const tags = [];
//     // const resValueArr = valueArr.map(item => {
//     //   if (item.startsWith('#')) {
//     //     // tags.push(item.slice(1));
//     //     return `<span class="tag">${item.slice(1)}</span>`
//     //   }
//     //   return item;
//     // })
//     for (const item of valueArr) {
//       if (item.startsWith('#')) {
//         tags.push(item.slice(1));
//       }
//     }
//     emit('update:modelValue', {
//       ...props.modelValue,
//       tags,
//     });
//   })
// }

const handleSelect = (item: SelectOptionUse<T>) => {
  emit('update:modelValue', {
    ...props.modelValue,
    value: '',
    prepend: item.value,
  });
  showOptions.value = false;
  emit('select', item.value, item);
  inputRef.value?.focus();
}

const handleOpenOptions = () => {
  showOptions.value = true;
}

watch([() => showOptions.value, () => activeIndex.value], ([show, index]) => {
  if (show) {
    currentFocusIndex = index;
    const currentItem = optionRefs.value[index];
    if (currentItem) {
      currentItem.focus();
    }
  } else {
    currentFocusIndex = 0;
  }
})
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
      case 'ArrowDown':
        if (showOptions.value) {
          e.preventDefault();
          currentFocusIndex++;
          if (currentFocusIndex >= optionRefs.value.length) {
            currentFocusIndex = 0;
          }
          optionRefs.value[currentFocusIndex].focus();
        }
        break;
      case 'ArrowUp':
        if (showOptions.value) {
          e.preventDefault();
          currentFocusIndex--;
          if (currentFocusIndex < 0) {
            currentFocusIndex = optionRefs.value.length - 1;
          }
          optionRefs.value[currentFocusIndex].focus();
        }
        break;
      case 'Enter':
        if (showOptions.value) {
          e.preventDefault();
          handleSelect(optionsUse.value[currentFocusIndex]);
        }
        break;
      case 'Escape':
        if (showOptions.value) {
          e.preventDefault();
          e.stopPropagation();
          showOptions.value = false;
          inputRef.value?.focus();
        }
        break;
    }
}
onMounted(() => {
  if (!props.modelValue?.prepend) {
    emit('update:modelValue', { prepend: optionsUse.value[0].value });
  }
  window.addEventListener('keydown', handleKeyDown, {
    capture: true
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown, {
    capture: true
  });
})

defineExpose<MentionRef>({
  focus: () => {
    inputRef.value?.focus();
  }
})
</script>

<style lang="scss" scoped>
.mention-container {
  min-width: 200px;
  // TODO: 后期扩展 tag 处理
  // height: 40px;
  // display: flex;
  // align-items: center;
  // border-radius: 4px;
  // padding: 0 12px;
  // box-sizing: border-box;
  .prepend {
    flex-shrink: 0;
    margin-right: 8px;
  }

  .input-main {
    flex: 1;
    line-height: 40px;
    outline: none;
    border: none;
    background-color: transparent;
    text-align: left;
    color: #1c1917;
    font-size: 16px;
    font-weight: 400;
    white-space: nowrap;
  }

  .input-container {
    border: 1px solid #e2e8f0;
    border-radius: 4px;
  }

  :deep(.el-input-group__prepend) {
    padding: 0 12px;
  }

  :deep(.el-select__placeholder) {
    display: none;
  }

  :deep(.el-select__suffix) {
    display: none;
  }
}

.options-container {
  max-height: 300px;
  overflow-y: auto;
  padding-left: 0;
  margin-bottom: 0;
  // border-radius: 4px;
  // background-color: #fff;
  // padding: 4px;

  >li {
    height: 40px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 0 12px;
    border-radius: 2px;
    outline: none;
    margin-top: 4px;
    color: #1c1917;

    &:first-child {
      margin-top: 0;
    }

    &:not(.active):hover,
    &:not(.active):focus {
      background-color: #f5f5f4;
      color: #1c1917;
    }

    &.active {
      background-color: #6366f1;
      color: #fff;
    }
  }
}
</style>
