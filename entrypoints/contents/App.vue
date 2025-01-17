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
import { storageInstance } from '../global/utils/storage';
import { useSettings } from '../global/hooks/useSettings';
import { StorageKey } from '../global/enum/storage';
import interact from 'interactjs';

let isDrag = false;
const edgeGap = 0;
const { t, locale: _locale } = useI18n();
const { settings } = useSettings();
const searchValue = ref('');
const containerRef = ref<HTMLDivElement | null>(null);
const showSearch = ref(false);
const dialogFormVisible = ref(false);
const formRef = ref<FormInstance | null>(null);
const searchPlatforms = ref<SearchPlatformItem[]>(defaultSearchPlatforms);
const searchPlatformOptions = computed<SearchPlatformItem[]>(() => {
  return [...searchPlatforms.value, addSearchPlatform];
})
const locale = computed(() => {
  if (_locale.value.includes('zh')) {
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

const setContainerPosition = (pos: { top: number, left: number }) => {
  if (containerRef.value) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const containerRect = containerRef.value?.getBoundingClientRect();
    const maxLeft = Math.floor(screenWidth - containerRect.width - edgeGap);
    const maxTop = Math.floor(screenHeight - containerRect.height - edgeGap);
    const left = Math.max(edgeGap, Math.min(pos.left, maxLeft));
    const top = Math.max(edgeGap, Math.min(pos.top, maxTop));
    containerRef.value.style.top = `${left}px`;
    containerRef.value.style.left = `${top}px`;
  }
}

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
      storageInstance.setItem(StorageKey.SEARCH_PLATFORMS, [...searchPlatforms.value]);
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
      // 处理拖拽
      if (containerRef.value) {
        storageInstance.getItem(StorageKey.CONTENT_RECT).then((res) => {
          if (!res) {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const containerRect = containerRef.value!.getBoundingClientRect();
            const x = (screenWidth - containerRect.width) / 2;
            const y = (screenHeight - containerRect.height) * 0.2;
            containerRef.value!.style.transform = `translate(${x}px, ${y}px)`;
            containerRef.value!.setAttribute('data-x', x.toString());
            containerRef.value!.setAttribute('data-y', y.toString());
          } else {
            const { x, y } = res;
            containerRef.value!.setAttribute('data-x', x.toString());
            containerRef.value!.setAttribute('data-y', y.toString());
            containerRef.value!.style.transform = `translate(${x}px, ${y}px)`;
          }
          nextTick(()=> {
            containerRef.value!.style.opacity = '1';
          })
        })
        interact(containerRef.value).draggable({
          inertia: true,
          listeners: {
            start: () => {
              isDrag = true;
            },
            move: handleDrag,
            end: handleDragEnd
          }
        })
      }
      if (mentionValue.value?.prepend === 'add') {
        mentionValue.value = undefined;
      }
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
    storageInstance.setItem(StorageKey.SEARCH_PLATFORMS, [...newSearchPlatforms]);
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

const handleBlur = () => {
  if (settings.value.closeOnBlur && !isDrag) {
    showSearch.value = false;
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
}

const handleDrag = (e: any) => {
  const target = e.target;
  if (!target) return;
  // keep the dragged position in the data-x/data-y attributes
  let x = (parseFloat(target.getAttribute('data-x')) || 0) + e.dx;
  let y = (parseFloat(target.getAttribute('data-y')) || 0) + e.dy;
  const rect = target.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - edgeGap; // 右边界
  const maxY = window.innerHeight - rect.height - edgeGap;
  x = Math.max(edgeGap, Math.min(x, maxX)); // 限制水平范围
  y = Math.max(edgeGap, Math.min(y, maxY));
  target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  // update the posiion attributes
  target.setAttribute('data-x', x)
  target.setAttribute('data-y', y)
}

const handleDragEnd = (e: any) => {
  const target = e.target;
  if (!target) return;
  const x = parseFloat(target.getAttribute('data-x') || '0');
  const y = parseFloat(target.getAttribute('data-y') || '0');
  storageInstance.setItem(StorageKey.CONTENT_RECT, {
    x,
    y
  })
  setTimeout(() => {
    isDrag = false;
  }, 100)
}

onMounted(() => {
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
    <div
      class="fixed top-[20vh] left-0 top-0 p-3 shadow bg-white flex gap-2 rounded-md opacity-0 z-[1000] json-search-content-container"
      v-if="showSearch" ref="containerRef" v-click-outside="handleBlur">
      <Mention :options="searchPlatformOptions" icon default-key="isDefault" v-model="mentionValue"
        containerStyle="width: 320px" @enter="handleEnter" ref="mentionRef" @select="handleSelect" />
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

<style scoped lang="scss">
.json-search-content-container {
  cursor: grab;

  :deep(.el-form-item--label-top .el-form-item__label) {
    display: block;
  }
}
</style>
