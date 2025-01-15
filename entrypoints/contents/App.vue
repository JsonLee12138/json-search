<script lang="ts" setup>
import Mention from './components/Mention/index.vue';
import { addSearchRules, addSearchPlatform, defaultSearchPlatforms } from './data';
import type { SearchPlatformItem } from '../global/types/type';
import { MentionRef, MentionValue } from './components/Mention/type';
import { ElMessageBox, FormInstance } from 'element-plus';
import 'element-plus/es/components/message-box/style/css'
import { initSearchPlatforms } from '../global/utils/initSearchPlatforms';
import { useI18n } from 'vue-i18n';
import { Language } from 'element-plus/lib/locale/index.js';
const { t, locale:_locale } = useI18n();
const searchValue = ref('');
const showSearch = ref(false);
const dialogFormVisible = ref(false);
const formRef = ref<FormInstance | null>(null);
const searchPlatforms = ref<SearchPlatformItem[]>(defaultSearchPlatforms);
const searchPlatformOptions = computed<SearchPlatformItem[]>(() => {
  return [...searchPlatforms.value, addSearchPlatform];
})
const locale = computed(()=> {
  if(_locale.value.includes('zh')){
    return 'zh-cn'
  }
  return 'en'
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
    if (!url) return;
    if (!keywords) {
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
        value: formData.value || formData.label,
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
    t('deleteConfirm.content'),
    t('deleteConfirm.title'),
    {
      confirmButtonText: t('button.ok'),
      cancelButtonText: t('button.cancel'),
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
  } else {
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
  <el-config-provider :locale="locale as unknown as Language">
    <div class="fixed top-[20vh] left-[50%] translate-x-[-50%] p-3 shadow bg-white flex gap-2 rounded-md z-[1000]"
      v-if="showSearch">
      <Mention :options="searchPlatformOptions" icon v-model="mentionValue" containerStyle="width: 320px"
        @enter="handleEnter" ref="mentionRef" @select="handleSelect" />
      <!-- <el-mention v-model="searchValue" :options="searchPlatformOptions" style="width: 320px" placeholder="请输入"
        @select="handleSelect" :filter-option="handleFilterOption" @keydown.enter="handleEnter" ref="inputRef"
        :style="{ '--el-input-text-color': '#020617' }">
      </el-mention> -->
      <el-button type="primary" @click="handleSearch">{{ $t('search') }}</el-button>
    </div>
    <el-dialog v-model="dialogFormVisible" :title="$t('addForm.title')" width="500" :before-close="handleBeforeClose">
      <el-form :model="formData" :rules="addSearchRules" label-position="top" @submit.prevent="handleAddSubmit"
        ref="formRef">
        <el-form-item :label="$t('addForm.label.name')" prop="label">
          <el-input v-model="formData.label" autocomplete="off" :placeholder="$t('addForm.placeholder.name')" />
        </el-form-item>
        <el-form-item :label="$t('addForm.label.key')" prop="value">
          <el-input v-model="formData.value" autocomplete="off" :placeholder="$t('addForm.placeholder.key')" />
          <div class="text-xs text-stone-300 mt-1">{{ $t('addForm.desc.key') }}</div>
        </el-form-item>
        <el-form-item :label="$t('addForm.label.icon')" prop="icon">
          <el-input v-model="formData.icon" autocomplete="off" :placeholder="$t('addForm.placeholder.icon')" />
          <div class="text-xs text-stone-300 mt-1">{{ $t('addForm.desc.icon') }}</div>
        </el-form-item>
        <el-form-item :label="$t('addForm.label.url')" prop="url">
          <el-input v-model="formData.url" autocomplete="off" :placeholder="$t('addForm.placeholder.url')" />
          <div class="text-xs text-stone-300 mt-1 text-left list-outside list-disc">
            <div class="indent-1 mb-2">{{ $t('addForm.desc.url.title') }}</div>
            <ul class="pl-[2em]">
              <li>{{ $t('addForm.desc.url.first', { keyword: '{keyword}' }) }}</li>
              <li class="mt-1">{{ $t('addForm.desc.url.second', { keyword: '{keyword}' }) }}</li>
            </ul>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">{{ $t('button.cancel') }}</el-button>
          <el-button type="primary" @click="handleAddSubmit">
            {{ $t('button.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    <div class="fixed top-[20vh] left-[50%] translate-x-[-50%] p-3 shadow bg-white flex gap-2 rounded-md z-[1000]"
      v-if="showSearch">
      <Mention :options="searchPlatformOptions" icon v-model="mentionValue" containerStyle="width: 320px"
        @enter="handleEnter" ref="mentionRef" @select="handleSelect" />
      <!-- <el-mention v-model="searchValue" :options="searchPlatformOptions" style="width: 320px" placeholder="请输入"
        @select="handleSelect" :filter-option="handleFilterOption" @keydown.enter="handleEnter" ref="inputRef"
        :style="{ '--el-input-text-color': '#020617' }">
      </el-mention> -->
      <el-button type="primary" @click="handleSearch">{{ $t('search') }}</el-button>
    </div>
    <el-dialog v-model="dialogFormVisible" :title="$t('addForm.title')" width="500" :before-close="handleBeforeClose">
      <el-form :model="formData" :rules="addSearchRules" label-position="top" @submit.prevent="handleAddSubmit"
        ref="formRef">
        <el-form-item :label="$t('addForm.label.name')" prop="label">
          <el-input v-model="formData.label" autocomplete="off" :placeholder="$t('addForm.placeholder.name')" />
        </el-form-item>
        <el-form-item :label="$t('addForm.label.key')" prop="value">
          <el-input v-model="formData.value" autocomplete="off" :placeholder="$t('addForm.placeholder.key')" />
          <div class="text-xs text-stone-300 mt-1">{{ $t('addForm.desc.key') }}</div>
        </el-form-item>
        <el-form-item :label="$t('addForm.label.icon')" prop="icon">
          <el-input v-model="formData.icon" autocomplete="off" :placeholder="$t('addForm.placeholder.icon')" />
          <div class="text-xs text-stone-300 mt-1">{{ $t('addForm.desc.icon') }}</div>
        </el-form-item>
        <el-form-item :label="$t('addForm.label.url')" prop="url">
          <el-input v-model="formData.url" autocomplete="off" :placeholder="$t('addForm.placeholder.url')" />
          <div class="text-xs text-stone-300 mt-1 text-left list-outside list-disc">
            <div class="indent-1 mb-2">{{ $t('addForm.desc.url.title') }}</div>
            <ul class="pl-[2em]">
              <li>{{ $t('addForm.desc.url.first', { keyword: '{keyword}' }) }}</li>
              <li class="mt-1">{{ $t('addForm.desc.url.second', { keyword: '{keyword}' }) }}</li>
            </ul>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">{{ $t('button.cancel') }}</el-button>
          <el-button type="primary" @click="handleAddSubmit">
            {{ $t('button.ok') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    <div class="fixed top-[20vh] left-[50%] translate-x-[-50%] p-3 shadow bg-white flex gap-2 rounded-md z-[1000]"
      v-if="showSearch">
      <Mention :options="searchPlatformOptions" icon v-model="mentionValue" containerStyle="width: 320px"
        @enter="handleEnter" ref="mentionRef" @select="handleSelect" />
      <!-- <el-mention v-model="searchValue" :options="searchPlatformOptions" style="width: 320px" placeholder="请输入"
        @select="handleSelect" :filter-option="handleFilterOption" @keydown.enter="handleEnter" ref="inputRef"
        :style="{ '--el-input-text-color': '#020617' }">
      </el-mention> -->
      <el-button type="primary" @click="handleSearch">{{ $t('search') }}</el-button>
    </div>
    <el-dialog v-model="dialogFormVisible" :title="$t('addForm.title')" width="500" :before-close="handleBeforeClose">
      <el-form :model="formData" :rules="addSearchRules" label-position="top" @submit.prevent="handleAddSubmit"
        ref="formRef">
        <el-form-item :label="$t('addForm.label.name')" prop="label">
          <el-input v-model="formData.label" autocomplete="off" :placeholder="$t('addForm.placeholder.name')" />
        </el-form-item>
        <el-form-item :label="$t('addForm.label.key')" prop="value">
          <el-input v-model="formData.value" autocomplete="off" :placeholder="$t('addForm.placeholder.key')" />
          <div class="text-xs text-stone-300 mt-1">{{ $t('addForm.desc.key') }}</div>
        </el-form-item>
        <el-form-item :label="$t('addForm.label.icon')" prop="icon">
          <el-input v-model="formData.icon" autocomplete="off" :placeholder="$t('addForm.placeholder.icon')" />
          <div class="text-xs text-stone-300 mt-1">{{ $t('addForm.desc.icon') }}</div>
        </el-form-item>
        <el-form-item :label="$t('addForm.label.url')" prop="url">
          <el-input v-model="formData.url" autocomplete="off" :placeholder="$t('addForm.placeholder.url')" />
          <div class="text-xs text-stone-300 mt-1 text-left list-outside list-disc">
            <div class="indent-1 mb-2">{{ $t('addForm.desc.url.title') }}</div>
            <ul class="pl-[2em]">
              <li>{{ $t('addForm.desc.url.first', { keyword: '{keyword}' }) }}</li>
              <li class="mt-1">{{ $t('addForm.desc.url.second', { keyword: '{keyword}' }) }}</li>
            </ul>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">{{ $t('button.cancel') }}</el-button>
          <el-button type="primary" @click="handleAddSubmit">
            {{ $t('button.ok') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-config-provider>
</template>

<style scoped>
:deep(.el-form-item--label-top .el-form-item__label) {
  display: block;
}
</style>
