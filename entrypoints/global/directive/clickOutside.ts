import type { Directive } from "vue";

export const vClickOutside: Directive = {
  mounted(el, binding: DirectiveBinding) {
    const handler = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) {
        binding.value?.(e);
      }
    }
    el.__clickOutsideHandler__ = handler;
    window.addEventListener('click', handler);
  },
  beforeUnmount(el) {
    window.removeEventListener('click', el.__clickOutsideHandler__);
  },
}
