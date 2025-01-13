<script lang="ts" setup>
import Mention from './components/Mention/index.vue';
import { addSearchRules, addSearchPlatform, defaultSearchPlatforms } from './data';
import type { SearchPlatformItem } from '../global/types/type';
import { MentionRef, MentionValue } from './components/Mention/type';
import { ElMessageBox, FormInstance } from 'element-plus';
import 'element-plus/es/components/message-box/style/css'
import { initSearchPlatforms } from '../global/utils/initSearchPlatforms';
const searchValue = ref('');
const showSearch = ref(false);
const dialogFormVisible = ref(false);
const formRef = ref<FormInstance | null>(null);
const searchPlatforms = ref<SearchPlatformItem[]>(defaultSearchPlatforms);
const searchPlatformOptions = computed<SearchPlatformItem[]>(() => {
  return [...searchPlatforms.value, addSearchPlatform];
})
const formData = reactive<SearchPlatformItem>({
  label: '',
  value: '',
  url: '',
  sort: 0,
  isDefault: false,
  icon: ''
});
const mentionValue = ref<MentionValue>();
const mentionRef = ref<MentionRef | null>(null);
const handleEnter = () => {
  handleSearch();
};
const hasPlatform = (platform?: string) => {
  if (platform) {
    const platformInfo = searchPlatforms.value.find(item => item.value === platform || item.label === platform);
    if (platformInfo) {
      return platformInfo;
    }
  }
  return false;
}
const handleSearch = () => {
  const trimmedValue = mentionValue.value?.value || '';
  const valueArray = trimmedValue.split(' ').filter(Boolean);
  const platformInfo = hasPlatform(mentionValue.value?.prepend);
  if (platformInfo) {
    const keywords = valueArray.map((item) => {
      const itemTrimmed = item.trim();
      if (itemTrimmed.startsWith('#')) {
        return `"${itemTrimmed.slice(1)}"`
      }
      return itemTrimmed;
    }).join(' ');
    const url = platformInfo?.url.replace('{keyword}', encodeURIComponent(keywords));
    console.log(url);
    if (!url) return;
    if(!keywords){
      chrome.runtime.sendMessage({
        action: 'open_url',
        url: platformInfo.url
      })
    } else {
      window.open(url, '_blank');
    }
    showSearch.value = false;
    handleResetMentionValue();
  }
}

const handleBeforeClose = () => {
  formRef.value?.resetFields();
  dialogFormVisible.value = false;
}

const handleAddSubmit = () => {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      searchValue.value = '';
      const item = {
        url: formData.url,
        label: formData.label,
        value: formData.value,
        sort: formData.sort,
        isDefault: formData.isDefault,
        icon: ''
      }
      searchPlatforms.value.push(item);
      chrome.storage?.local.set({
        searchPlatforms: [...searchPlatforms.value]
      })
      dialogFormVisible.value = false;
    }
  })
}

const handleSelect = (value: string) => {
  if (value === 'add') {
    dialogFormVisible.value = true;
  }
}

watch(() => showSearch.value, (newVal) => {
  if (newVal) {
    nextTick(() => {
      mentionRef.value?.focus();
    })
  } else {
    searchValue.value = '';
  }
})

const handleDeleteSearchPlatform = (item: SearchPlatformItem) => {
  ElMessageBox.confirm(
    '确定要删除当前搜索引擎吗?',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const newSearchPlatforms = searchPlatforms.value.filter(cur => cur.value !== item.value);
    chrome.storage?.local.set({
      searchPlatforms: [...newSearchPlatforms]
    })
    searchPlatforms.value = [...newSearchPlatforms];
  })
}

const handleResetMentionValue = () => {
  const platform = searchPlatforms.value.find(item => item.isDefault);
  if (platform) {
    mentionValue.value = new MentionValue({
      prepend: platform.value
    })
  }else{
    const platform = searchPlatforms.value[0] || {};
    mentionValue.value = new MentionValue({
      prepend: platform.value
    })
  }
}

const addOpenListener = () => {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'open_search') {
      showSearch.value = true;
    }
    if (message.action === 'add_search_platform') {
      dialogFormVisible.value = true;
    }
    if (message.action === 'delete_search_platform') {
      handleDeleteSearchPlatform(message.item);
    }
  });
  // 页面层监听
  // 为了性能请将这里代码写在 keydown 监听外, 下面主要监听内容写在监听内
  // let isMac = false;
  // // @ts-ignore
  // if (navigator.userAgentData) {
  //   // @ts-ignore
  //   isMac = navigator.userAgentData.platform.toUpperCase().includes("MAC");
  // } else {
  //   isMac = navigator.platform.toUpperCase().includes("MAC");
  // }
  // 主要监听内容
  // if (!e.isComposing && e.code === 'Space' && e.shiftKey) {
  //   if (isMac && e.metaKey) {
  //     showSearch.value = true;
  //   } else if (!isMac && e.ctrlKey) {
  //     showSearch.value = true;
  //   }
  // }
}

onMounted(() => {
  // chrome.storage?.local.get('searchPlatforms', (res) => {
  //   if (!res || !res.searchPlatforms?.length) {
  //     chrome.storage?.local.set({
  //       searchPlatforms: [...defaultSearchPlatforms]
  //     })
  //     searchPlatforms.value = [...defaultSearchPlatforms];
  //   } else {
  //     searchPlatforms.value = res.searchPlatforms;
  //   }
  // })
  initSearchPlatforms().then(res => {
    searchPlatforms.value = res;
    handleResetMentionValue();
  });
  addOpenListener();
  window.addEventListener('keydown', (e) => {
    if (!e.isComposing && e.code === 'Escape') {
      showSearch.value = false;
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', (e) => { });
  chrome.runtime.onMessage.removeListener(() => { });
})
</script>

<template>
  <div class="fixed top-[20vh] left-[50%] translate-x-[-50%] p-3 shadow bg-white flex gap-2 rounded-md z-[1000]"
    v-if="showSearch">
    <Mention :options="searchPlatformOptions" icon v-model="mentionValue" containerStyle="width: 320px"
      @enter="handleEnter" ref="mentionRef" @select="handleSelect" />
    <!-- <el-mention v-model="searchValue" :options="searchPlatformOptions" style="width: 320px" placeholder="请输入"
      @select="handleSelect" :filter-option="handleFilterOption" @keydown.enter="handleEnter" ref="inputRef"
      :style="{ '--el-input-text-color': '#020617' }">
    </el-mention> -->
    <el-button type="primary" @click="handleSearch">搜索</el-button>
  </div>
  <el-dialog v-model="dialogFormVisible" title="新增搜索" width="500" :before-close="handleBeforeClose">
    <el-form :model="formData" :rules="addSearchRules" label-position="top" @submit.prevent="handleAddSubmit"
      ref="formRef">
      <el-form-item label="名称" prop="label">
        <el-input v-model="formData.label" autocomplete="off" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="搜索关键key" prop="value" inline-message="请输入搜索关键字">
        <el-input v-model="formData.value" autocomplete="off" placeholder="请输入搜索关键key" />
        <div class="text-xs text-stone-300 mt-1">如果没有填写默认和名称一样</div>
      </el-form-item>
      <el-form-item label="图标URL" prop="icon" inline-message="请输入图标URL">
        <el-input v-model="formData.icon" autocomplete="off" placeholder="请输入图标URL" />
        <div class="text-xs text-stone-300 mt-1">如果没有填写会在第一次打开网站的时候获取</div>
      </el-form-item>
      <el-form-item label="搜索地址" prop="url">
        <el-input v-model="formData.url" autocomplete="off" placeholder="请输入搜索地址" />
        <div class="text-xs text-stone-300 mt-1 text-left list-outside list-disc">
          <div class="indent-1 mb-2">填写规则如下:</div>
          <ul class="pl-[2em]">
            <li>{keyword} 表示搜索关键字;</li>
            <li class="mt-1">例如: https://google.com/search?q={keyword}</li>
          </ul>
        </div>
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

<style scoped>
:deep(.el-form-item--label-top .el-form-item__label) {
  display: block;
}
</style>
