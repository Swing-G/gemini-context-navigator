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

    this.storage.loadSettings().then((settings) => {
      this.settings = settings;
      this.ui.create();
      this.ui.applySettings(this.settings);
      this.setupObservers();
      this.setupEventListeners();

      setTimeout(() => this.scanMessages(), 2000);
    });
  }

  setupObservers() {
    const observer = new MutationObserver(
      GeminiNavigatorUtils.debounce(() => {
        this.scanMessages();
      }, 500)
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupEventListeners() {
    let lastUrl = location.href;

    new MutationObserver(() => {
      const url = location.href;

      if (url !== lastUrl) {
        lastUrl = url;
        this.ui.clearPins();
        this.scanMessages();
      }
    }).observe(document, {
      subtree: true,
      childList: true
    });
  }

  scanMessages() {
    const elements = this.scanner.findUserMessageElements();

    if (!this.scanner.hasChanged(elements, this.messages.length)) {
      return;
    }

    this.messages = this.scanner.buildMessages(elements, this.settings);
    this.ui.renderMessages(this.messages);
  }

  navigate(direction) {
    const targetIndex = this.scroll.navigate(this.messages, direction);

    if (targetIndex !== null) {
      this.ui.highlightActive(targetIndex);
    }
  }
}

new GeminiNavigator();
