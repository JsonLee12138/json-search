<script lang="ts" setup>
import { SearchPlatformItem } from '../global/types/type';
import { initSearchPlatforms } from '../global/utils/initSearchPlatforms';
import { ref, computed } from 'vue';
import { TabItem, tabs, TabValue } from './config';
import { useI18n } from 'vue-i18n';
import { Language } from 'element-plus/lib/locale/index.js';
import { zhCn, en } from 'element-plus/es/locales.mjs';
import { storageInstance } from '../global/utils/storage';
import { StorageKey } from '../global/enum/storage';
import { useSettings } from '../global/hooks/useSettings';


const { locale: _locale } = useI18n();
const { settings } = useSettings();

const locale = computed(() => {
  if (_locale.value.includes('zh')) {
    return zhCn;
  }
  return en;
})

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
    storageInstance.setItem(StorageKey.SEARCH_PLATFORMS, newSearchPlatforms);
    searchPlatforms.value = newSearchPlatforms;
  },
})

const handleSetDefault = (item: SearchPlatformItem) => {
  // console.log(item, 'item')
  modelValue.value = item.value;
}

const sendMessage = (params: Record<string, any>) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // console.log(tabs, 'tabs')
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, params);
    }
  })
}

const handleAddSearchPlatform = () => {
  // console.log('新增')
  sendMessage({
    action: 'add_search_platform',
  })
  nextTick(() => {
    window.close();
  })
}


const handleDeleteSearchPlatform = (item: SearchPlatformItem) => {
  sendMessage({
    action: 'delete_search_platform',
    item
  })
  nextTick(() => {
    window.close();
  })
}

const handleChangeTab = (item: TabItem) => {
  activeTab.value = item.value;
}

const handleOpenURL = (url: string) => {
  // console.log(url, 'url')
  chrome.tabs.create({ url });
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
  <el-config-provider :locale="locale as unknown as Language">
    <div class="p-4 shadow-md rounded-md json-search-popup">
      <div class="tabs-container border-stone-200">
        <div class="border-stone-200" :class="{ 'active': activeTab === item.value }" v-for="item in tabs"
          :key="item.value" @click="handleChangeTab(item)">
          {{ item.label }}
        </div>
      </div>
      <div class="text-stone-700 text-sm" v-if="activeTab === 'help'">
        <div>{{ $t('help.usage') }}: </div>
        <ol class="pl-5.5 flex flex-col gap-2 text-sm m-0 mt-1.5">
          <li>{{ $t('help.usage_content.first') }}</li>
          <li class="text-rose-500">{{ $t('help.usage_content.secondBefore') }}<span
              class="text-blue-500 hover:text-blue-400 cursor-pointer active:text-blue-700"
              @click="handleOpenURL('chrome://extensions/shortcuts')">chrome://extensions/shortcuts</span>{{
                $t('help.usage_content.secondAfter') }}</li>
          <li>{{ $t('help.usage_content.third', { key: '@' }) }}</li>
          <li>{{ $t('help.usage_content.four') }}</li>
        </ol>
      </div>
      <template v-if="activeTab === 'list'">
        <div class="flex-1 flex flex-col overflow-hidden">
          <ul class="list-none options-container flex-1 overflow-y-auto">
            <li v-for="item in searchPlatforms" :key="`option-${item.value}`" :class="{
              'active': modelValue === item.value
            }">
              <div class="flex items-center gap-2">
                <img :src="item.icon" width="18" height="18" alt="" class="rounded-full" v-if="item.icon">
                <span class="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">{{ item.label }}</span>
              </div>
              <div class="flex gap-2">
                <div
                  class="text-xs text-indigo-500 active:text-indigo-700 no-select hover:text-indigo-300 whitespace-nowrap"
                  v-if="!item.isDefault" @click="handleSetDefault(item)">
                  {{ $t('button.setDefault') }}
                </div>
                <div class="text-xs text-stone-500 no-select" v-else>{{ $t('default') }}</div>
                <div class="text-xs text-rose-500 no-select cursor-pointer hover:text-rose-300 active:text-rose-700"
                  @click="handleDeleteSearchPlatform(item)">{{ $t('button.delete') }}</div>
              </div>
            </li>
          </ul>
          <el-button type="primary" @click="handleAddSearchPlatform" class="w-full mt-2 flex-shrink-0">
            {{ $t('button.add') }}
          </el-button>
        </div>
      </template>
      <template v-if="activeTab === 'settings'">
        <!-- TODO: 快捷键设置 -->
        <!-- <div class="text-stone-700 text-sm text-center mt-4">{{ $t('notDevYet') }}</div> -->
        <ul class="list-none p-0">
          <li class="flex gap-5 items-center justify-between  mx-2">
            <label>{{ $t('settings.label.closeOnBlur') }}</label>
            <el-switch v-model="settings.closeOnBlur" />

          </li>
        </ul>
      </template>
    </div>
  </el-config-provider>
</template>

<style scoped lang="scss">
.json-search-popup {
  background-color: #fff;
  display: flex;
  flex-direction: column;
  max-height: 560px;
  min-width: 240px;
  width: fit-content;
}

.tabs-container {
  border-width: 1px;
  border-style: solid;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  margin-bottom: 4px;
  flex-shrink: 0;

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
  // max-height: 600px;
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
    gap: 20px;

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
