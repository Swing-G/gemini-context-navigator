class GeminiNavigatorScroll {
  scrollToElement(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  scrollAll(top) {
    window.scrollTo({
      top: top ? 0 : document.body.scrollHeight,
      behavior: 'smooth'
    });

    const candidates = document.querySelectorAll(
      'main, infinite-scroller, .scroll-container, [class*="scroll"]'
    );

    candidates.forEach((el) => {
      try {
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTo({
            top: top ? 0 : el.scrollHeight,
            behavior: 'smooth'
          });
        }
      } catch (error) {
        // Ignore inaccessible or non-scrollable containers.
      }
    });
  }

  findCurrentMessageIndex(messages) {
    if (!messages.length) return -1;

    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    messages.forEach((message, index) => {
      const rect = message.element.getBoundingClientRect();

      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        return;
      }

      const messageCenter = rect.top + rect.height / 2;
      const distance = Math.abs(messageCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestDistance !== Number.POSITIVE_INFINITY) {
      return closestIndex;
    }

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const rect = messages[i].element.getBoundingClientRect();

      if (rect.top <= viewportCenter) {
        return i;
      }
    }

    return 0;
  }

  navigate(messages, direction) {
    if (!messages.length) return null;

    const currentIndex = this.findCurrentMessageIndex(messages);
    const targetIndex = Math.max(
      0,
      Math.min(currentIndex + direction, messages.length - 1)
    );
    const target = messages[targetIndex];

    if (target) {
      this.scrollToElement(target.element);
    }

    return targetIndex;
  }
}
