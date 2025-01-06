<script lang="ts" setup>
import { ElMention, type MentionOption } from 'element-plus';
import { defaultSearchPlatformMap, addSearchRules, addSearchPlatform, getSearchPlatformsArray } from './data';
import type { SearchPlatform, SearchPlatformItem } from './type';
const searchValue = ref('');
const showSearch = ref(false);
const dialogFormVisible = ref(false);
const searchPlatforms = ref<Map<string, SearchPlatform>>(new Map());
const searchPlatformOptions = computed<SearchPlatformItem[]>(() => {
  return [...getSearchPlatformsArray(searchPlatforms.value), addSearchPlatform];
})
const formData = reactive<{
  name: string;
  searchKey: string;
  url: string;
}>({
  name: '',
  searchKey: '',
  url: '',
});
const inputRef = ref<typeof ElMention | null>(null);
const handleFilterOption = (pattern: string, option: MentionOption) => {
  const lowerPattern = pattern.toLocaleLowerCase();
  const lowerLabel = option.label?.toLocaleLowerCase();
  const lowerRealValue = option.realValue?.toLocaleLowerCase();
  return lowerRealValue?.includes(lowerPattern) || lowerLabel?.includes(lowerPattern);
};
const handleEnter = (e: KeyboardEvent) => {
  if (e.isComposing) return;
  handleSearch();
};
const hasPlatform = (platform?: string) => {
  if (platform) {
    if (searchPlatforms.value.has(platform)) {
      return searchPlatforms.value.get(platform);
    }
    const platformInfo = searchPlatformOptions.value.find(item => (item.value === platform) || (item.realValue === platform));
    if (platformInfo) {
      return platformInfo;
    }
  }
  return false;
}
const handleSearch = () => {
  const trimmedValue = searchValue.value.trim();
  if (!trimmedValue.startsWith('@')) return;
  const valueArray = trimmedValue.split(' ').filter(Boolean);
  const platform = valueArray.shift()?.trim().replace('@', '').toLocaleLowerCase();
  const platformInfo = hasPlatform(platform);
  if (platformInfo) {
    const keywords = valueArray.map((item) => {
      const itemTrimmed = item.trim();
      if (itemTrimmed.startsWith('#')) {
        return `"${itemTrimmed.slice(1)}"`
      }
      return itemTrimmed;
    }).join(' ');
    const url = platformInfo?.url.replace('{keyword}', keywords);
    if (!url) return;
    window.open(url, '_blank');
  }
}

const handleSelect = (option: MentionOption) => {
  if (option.realValue === 'add') {
    dialogFormVisible.value = true;
  }
}

const handleBeforeClose = () => {
  dialogFormVisible.value = false;
  formData.name = '';
  formData.searchKey = '';
  formData.url = '';
  searchValue.value = '';
}

const handleAddSubmit = () => {
  searchValue.value = '';
  const item = {
    url: formData.url,
    title: formData.name
  }
  searchPlatforms.value.set(formData.searchKey, item);
  chrome.storage?.local.set({
    searchPlatforms: [...searchPlatforms.value]
  })
  dialogFormVisible.value = false;
}
watch(() => showSearch.value, (newVal) => {
  if (newVal) {
    nextTick(() => {
      inputRef.value?.input.focus();
    })
  } else {
    searchValue.value = '';
  }
})
onMounted(() => {
  chrome.storage?.local.get('searchPlatforms', (res) => {
    if (!res || !res.searchPlatforms?.length) {
      chrome.storage?.local.set({
        searchPlatforms: [...defaultSearchPlatformMap]
      })
      searchPlatforms.value = defaultSearchPlatformMap;
    } else {
      searchPlatforms.value = new Map(res.searchPlatforms);
    }
  })
  let isMac = false;
  // @ts-ignore
  if (navigator.userAgentData) {
    // @ts-ignore
    isMac = navigator.userAgentData.platform.toUpperCase().includes("MAC");
  } else {
    isMac = navigator.platform.toUpperCase().includes("MAC");
  }
  window.addEventListener('keydown', (e) => {
    if (!e.isComposing && e.code === 'Space' && e.shiftKey) {
      if (isMac && e.metaKey) {
        showSearch.value = true;
      } else if (!isMac && e.ctrlKey) {
        showSearch.value = true;
      }
    }
    if (!e.isComposing && e.code === 'Escape') {
      showSearch.value = false;
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', (e) => { })
})
</script>

<template>
  <div class="fixed top-[20vh] left-[50%] translate-x-[-50%] p-3 shadow bg-white flex gap-2 rounded-md"
    v-if="showSearch">
    <el-mention v-model="searchValue" :options="searchPlatformOptions" style="width: 320px" placeholder="请输入"
      @select="handleSelect" :filter-option="handleFilterOption" @keydown.enter="handleEnter" ref="inputRef"
      :style="{ '--el-input-text-color': '#020617' }">
    </el-mention>
    <el-button type="primary" @click="handleSearch">搜索</el-button>
  </div>
  <el-dialog v-model="dialogFormVisible" title="新增搜索" width="800" :before-close="handleBeforeClose">
    <el-form :model="formData" :rules="addSearchRules" label-width="82px" @submit.prevent="handleAddSubmit">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" autocomplete="off" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="搜索关键字" prop="searchKey" inline-message="请输入搜索关键字">
        <el-input v-model="formData.searchKey" autocomplete="off" placeholder="请输入搜索关键字" />
        <div class="text-xs text-stone-300 mt-1">如果没有填写默认和名称一样</div>
      </el-form-item>
      <el-form-item label="搜索地址" prop="url">
        <el-input v-model="formData.url" autocomplete="off" placeholder="请输入搜索地址" />
        <div class="text-xs text-stone-300 mt-1">填写规则如下: {keyword} 表示搜索关键字; <br />例如:
          https://google.com/search?q={keyword}</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddSubmit">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped></style>
