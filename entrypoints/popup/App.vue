<script lang="ts" setup>
import { SearchPlatformItem } from '../global/types/type';
import { initSearchPlatforms } from '../global/utils/initSearchPlatforms';
import { ref, computed } from 'vue';
import { TabItem, tabs, TabValue } from './config';

const searchPlatforms = ref<SearchPlatformItem[]>([]);
const activeTab = ref<TabValue>(tabs[0].value);
const modelValue = computed({
  get: () => {
    return searchPlatforms.value.find(item => item.isDefault)?.value;
  },
  set: (value) => {
    const newSearchPlatforms = searchPlatforms.value.map(item => {
      if (item.value === value) {
        return {
          ...item,
          isDefault: true,
        };
      } else {
        return {
          ...item,
          isDefault: false,
        };
      }
    })
    chrome.storage?.local.set({
      searchPlatforms: newSearchPlatforms,
    })
    searchPlatforms.value = newSearchPlatforms;
  },
})

const handleSetDefault = (item: SearchPlatformItem) => {
  console.log(item, 'item')
  modelValue.value = item.value;
}

const sendMessage = (params: Record<string, any>) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log(tabs, 'tabs')
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, params);
    }
  })
}

const handleAddSearchPlatform = () => {
  console.log('新增')
  sendMessage({
    action: 'add_search_platform',
  })
}


const handleDeleteSearchPlatform = (item: SearchPlatformItem) => {
  sendMessage({
    action: 'delete_search_platform',
    item
  })
  // const newSearchPlatforms = searchPlatforms.value.filter(cur => cur.value !== item.value);
  // chrome.storage?.local.set({
  //   searchPlatforms: newSearchPlatforms,
  // })
  // searchPlatforms.value = newSearchPlatforms;

}

const handleChangeTab = (item: TabItem) => {
  activeTab.value = item.value;
}

onMounted(async () => {
  try {
    const res = await initSearchPlatforms();
    searchPlatforms.value = res;
  } catch (error) {
    console.error(error, 'error')
  }
})
</script>

<template>
  <div class="p-4 shadow-md rounded-md min-w-[240px]">
    <div class="tabs-container border-stone-200">
      <div class="border-stone-200" :class="{ 'active': activeTab === item.value }" v-for="item in tabs" :key="item.value"
        @click="handleChangeTab(item)">
        {{ item.label }}
      </div>
    </div>
    <div class="text-stone-700 text-sm" v-if="activeTab === 'help'">
      <div>使用方法: </div>
      <ol class="pl-5.5 flex flex-col gap-2 text-sm m-0 mt-1.5">
        <li>使用快捷键: ctrl+shift+空格(mac的是command+shift+空格)</li>
        <li>必须先选择搜索引擎, 输入@进行选择</li>
        <li>输入搜索关键词, 回车即可搜索(如果比选关键字用#前后用空格例如: 其他关键字 #测试 其他关键字)</li>
      </ol>
    </div>
    <template v-if="activeTab === 'list'">
      <ul class="list-none options-container">
        <li v-for="item in searchPlatforms" :key="`option-${item.value}`" :class="{
          'active': modelValue === item.value
        }">
          <div class="flex items-center gap-2">
            <img :src="item.icon" width="18" height="18" alt="" class="rounded-full" v-if="item.icon">
            <span class="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">{{ item.label }}</span>
          </div>
          <div class="flex gap-2">
            <div class="text-xs text-indigo-500 active:text-indigo-700 no-select hover:text-indigo-300"
              v-if="!item.isDefault" @click="handleSetDefault(item)">
              设为默认
            </div>
            <div class="text-xs text-stone-500 no-select" v-else>默认</div>
            <div class="text-xs text-rose-500 no-select cursor-pointer hover:text-rose-300 active:text-rose-700"
              @click="handleDeleteSearchPlatform(item)">删除</div>
          </div>
        </li>
      </ul>
      <el-button type="primary" @click="handleAddSearchPlatform" class="w-full mt-2">新增</el-button>
    </template>
    <template v-if="activeTab === 'settings'">
      <div class="text-stone-700 text-sm text-center mt-4">当前功能尚未开发</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.tabs-container {
  border-width: 1px;
  border-style: solid;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  margin-bottom: 4px;

  >div {
    border-left-width: 1px;
    border-left-style: solid;
    flex: 1;
    text-align: center;
    line-height: 30px;
    cursor: pointer;

    &:first-child {
      border-left: none;
    }

    &.active {
      background-color: #6366f1;
      color: #fff;
    }
  }
}

.options-container {
  max-height: 600px;
  overflow-y: auto;
  padding-left: 0;
  margin-bottom: 0;
  margin-top: 0;

  >li {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 0 12px;
    border-radius: 2px;
    outline: none;
    margin-top: 4px;
    color: #1c1917;

    &:first-child {
      margin-top: 0;
    }

    &:hover {
      background-color: #f5f5f4;
      color: #1c1917;
    }

    // &.active {
    //   background-color: #6366f1;
    //   color: #fff;
    // }
  }
}
</style>
