import { throttle } from "lodash-es";
import type { Directive } from "vue";

export const vClickOutside: Directive = {
  mounted(el, binding: DirectiveBinding) {
    const handler = throttle((e: MouseEvent) => {
      const path = e.composedPath?.() || [];
      const index = path.findIndex(item => item === el);
      if(index < 0){
        binding.value?.(e);
      }
    }, 100)
    el.__clickOutsideHandler__ = handler;
    window.addEventListener('click', handler, true);
  },
  beforeUnmount(el) {
    window.removeEventListener('click', el.__clickOutsideHandler__);
    delete el.__clickOutsideHandler__;
  },
}
