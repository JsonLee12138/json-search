import type { Directive, DirectiveBinding } from "vue";

export const vClickOutside: Directive = {
  mounted(el, binding: DirectiveBinding) {
    const handler = (e: MouseEvent) => {
      const path = e.composedPath?.() || [];
      const index = path.findIndex(item => item === el);
      if(index < 0){
        binding.value?.(e);
      }
    }
    el.__clickOutsideHandler__ = handler;
    window.addEventListener('click', handler, true);
  },
  beforeUnmount(el) {
    window.removeEventListener('click', el.__clickOutsideHandler__, true);
    delete el.__clickOutsideHandler__;
  },
}
