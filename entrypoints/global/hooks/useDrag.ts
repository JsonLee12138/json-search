interface DragOptions {
  onDragStart?: (event: MouseEvent) => void;
  onDrag?: (event: MouseEvent) => void;
  onDragEnd?: (event: MouseEvent) => void;
}

export const useDrag = <T extends HTMLElement = HTMLElement>({onDragStart, onDrag, onDragEnd }: DragOptions) => {
  let isDragging = false;
  let isStart = false;
  const node = ref<T | null>(null);

  const isCurrent = (e: MouseEvent)=> {
    return node.value && node.value.contains(e.target);
  }

  const handleDragStart = (event: MouseEvent) => {
    if (isCurrent(event)) {
      isStart = true;
      onDragStart?.(event);
    }
  }
  const handleDrag = (e: MouseEvent) => {
    if(isStart && isCurrent(e)) {
      isDragging = true;
      onDrag?.(e);
    }
  }

  const handleDragEnd = (e: MouseEvent) => {
    if(isDragging){
      e.preventDefault();
      e.stopPropagation();
      onDragEnd?.(e);
    }
    isDragging = false;
    isStart = false;
  }
  onMounted(() => {
    window.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
  })
  onBeforeUnmount(() => {
    window.removeEventListener('mousedown', handleDragStart);
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('mouseup', handleDragEnd);
  })

  return node;
}
