class GeminiNavigator {
  constructor() {
    this.config = GeminiNavigatorConfig;
    this.storage = new GeminiNavigatorStorage(this.config.defaultSettings);
    this.scanner = new GeminiNavigatorScanner(this.config);
    this.scroll = new GeminiNavigatorScroll();
    this.messages = [];
    this.settings = { ...this.config.defaultSettings };
    this.ui = new GeminiNavigatorUI({
      scroll: this.scroll,
      onNavigate: (direction) => this.navigate(direction),
      onInitialScan: () => this.scanMessages()
    });

    this.init();
  }

  init() {
    console.log('Gemini Context Navigator: Initializing...');

    this.lastUrl = location.href;
    this.observer = null;
    this.observedTarget = null;

    this.storage.loadSettings().then((settings) => {
      this.settings = settings;
      this.ui.create();
      this.ui.applySettings(this.settings);
      this.setupObserver();
      this.setupUrlWatcher();
      this.setupScrollSpy();

      setTimeout(() => this.scanMessages(), 2000);
    });
  }

  findConversationContainer() {
    const selectors = this.config.selectors.conversationContainer.split(',');

    for (const selector of selectors) {
      const el = document.querySelector(selector.trim());
      if (el && el.children.length > 0) {
        return el;
      }
    }

    return null;
  }

  setupObserver() {
    const debouncedScan = GeminiNavigatorUtils.debounce(() => {
      this.scanMessages();
    }, 500);

    this.observer = new MutationObserver(debouncedScan);

    const container = this.findConversationContainer();

    if (container) {
      this.observedTarget = container;
      this.observer.observe(container, { childList: true, subtree: true });
      console.log('Gemini Context Navigator: Observing conversation container ->', container.tagName, container.className);
    } else {
      this.observedTarget = document.body;
      this.observer.observe(document.body, { childList: true, subtree: true });
      console.log('Gemini Context Navigator: Conversation container not found, falling back to document.body');
      this.scheduleContainerRetry();
    }
  }

  scheduleContainerRetry() {
    let retries = 0;
    const maxRetries = 10;
    const retryInterval = 3000;

    const retry = () => {
      retries += 1;
      const container = this.findConversationContainer();

      if (container && container !== this.observedTarget) {
        this.observer.disconnect();
        this.observedTarget = container;
        this.observer.observe(container, { childList: true, subtree: true });
        console.log('Gemini Context Navigator: Narrowed observer to conversation container ->', container.tagName, container.className);
        return;
      }

      if (retries < maxRetries) {
        setTimeout(retry, retryInterval);
      }
    };

    setTimeout(retry, retryInterval);
  }

  setupUrlWatcher() {
    const checkUrl = () => {
      const url = location.href;
      if (url !== this.lastUrl) {
        this.lastUrl = url;
        this.ui.clearPins();
        this.reattachObserver();
        this.scanMessages();
      }
    };

    window.addEventListener('popstate', checkUrl);
    window.addEventListener('hashchange', checkUrl);

    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;

    history.pushState = function (...args) {
      origPushState.apply(this, args);
      checkUrl();
    };

    history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      checkUrl();
    };
  }

  reattachObserver() {
    if (!this.observer) return;

    this.observer.disconnect();

    setTimeout(() => {
      const container = this.findConversationContainer();
      if (container) {
        this.observedTarget = container;
        this.observer.observe(container, { childList: true, subtree: true });
      } else {
        this.observedTarget = document.body;
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.scheduleContainerRetry();
      }
    }, 500);
  }

  setupScrollSpy() {
    const syncActiveMessage = GeminiNavigatorUtils.throttle(() => {
      this.syncActiveMessage();
    }, 150);

    window.addEventListener('scroll', syncActiveMessage, { passive: true });
    window.addEventListener('resize', syncActiveMessage);
    document.addEventListener('scroll', syncActiveMessage, {
      passive: true,
      capture: true
    });
  }

  syncActiveMessage() {
    const activeIndex = this.scroll.findCurrentMessageIndex(this.messages);
    this.ui.highlightActive(activeIndex, { scrollIntoView: this.ui.isSidebarOpen });
  }

  scanMessages() {
    const elements = this.scanner.findUserMessageElements();

    if (!this.scanner.hasChanged(elements, this.messages.length)) {
      return;
    }

    this.messages = this.scanner.buildMessages(elements, this.settings);
    this.ui.renderMessages(this.messages);
    this.syncActiveMessage();
  }

  navigate(direction) {
    const targetIndex = this.scroll.navigate(this.messages, direction);

    if (targetIndex !== null) {
      this.ui.highlightActive(targetIndex);
    }
  }
}

new GeminiNavigator();
