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
    let currentIndex = -1;

    for (let i = 0; i < messages.length; i += 1) {
      const rect = messages[i].element.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;

      if (absoluteTop >= window.scrollY) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex === -1) {
      currentIndex = messages.length - 1;
    }

    return currentIndex;
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
