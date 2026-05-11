class GeminiNavigatorUI {
  constructor({ scroll, onNavigate, onInitialScan }) {
    this.scroll = scroll;
    this.onNavigate = onNavigate;
    this.onInitialScan = onInitialScan;
    this.sidebar = null;
    this.tocList = null;
    this.pinnedList = null;
    this.pinnedItems = null;
    this.toggleBtn = null;
    this.messageCountBadge = null;
    this.isSidebarOpen = false;
    this.activeIndex = -1;
    this.pinnedMessages = new Set();
    this.isUserBrowsingTOC = false;
    this.browsingTimeout = null;
  }

  create() {
    try {
      this.createSidebar();
      this.createToggleButton();
      this.createQuickActions();
    } catch (error) {
      console.error('Gemini Context Navigator: Error creating UI', error);
    }
  }

  applySettings(settings) {
    try {
      const root = document.documentElement;

      if (settings.accentColor) {
        root.style.setProperty('--gn-accent-color', settings.accentColor);
      }

      if (settings.bgColor) {
        root.style.setProperty(
          '--gn-bg-color',
          GeminiNavigatorUtils.hexToRgba(settings.bgColor, 0.85)
        );
      }
    } catch (error) {
      console.warn('Gemini Context Navigator: Error applying settings', error);
    }
  }

  createSidebar() {
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'gemini-nav-sidebar';
    this.sidebar.innerHTML = `
      <div id="gn-toc-list"></div>
      <div id="gn-pinned-list" class="gn-pinned-section" style="display:none;">
        <div class="gn-section-title">Pinned</div>
        <div id="gn-pinned-items"></div>
      </div>
    `;

    document.body.appendChild(this.sidebar);
    this.tocList = this.sidebar.querySelector('#gn-toc-list');
    this.pinnedList = this.sidebar.querySelector('#gn-pinned-list');
    this.pinnedItems = this.sidebar.querySelector('#gn-pinned-items');

    this.tocList.addEventListener('mouseenter', () => {
      this.isUserBrowsingTOC = true;
      clearTimeout(this.browsingTimeout);
    });

    this.tocList.addEventListener('mouseleave', () => {
      clearTimeout(this.browsingTimeout);
      this.browsingTimeout = setTimeout(() => {
        this.isUserBrowsingTOC = false;
      }, 1500);
    });

    this.tocList.addEventListener('wheel', () => {
      this.isUserBrowsingTOC = true;
      clearTimeout(this.browsingTimeout);
      this.browsingTimeout = setTimeout(() => {
        this.isUserBrowsingTOC = false;
      }, 2000);
    }, { passive: true });
  }

  createToggleButton() {
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'gn-toggle-btn';
    toggleBtn.innerHTML = `
      <span class="gn-toggle-icon">☰</span>
      <span class="gn-message-count" style="display:none;">0</span>
    `;
    toggleBtn.title = 'Toggle Context Navigator';
    this.toggleBtn = toggleBtn;
    this.messageCountBadge = toggleBtn.querySelector('.gn-message-count');
    const toggleIcon = toggleBtn.querySelector('.gn-toggle-icon');

    let isDragging = false;
    let hasMoved = false;
    let startY;
    let startTop;
    let startX;
    let startLeft;
    let hoverTimeout;

    const showSidebar = () => {
      clearTimeout(hoverTimeout);
      this.isSidebarOpen = true;
      this.sidebar.classList.add('visible');
      this.scrollActiveItemIntoView();
      toggleIcon.textContent = '×';
      toggleBtn.style.opacity = '1';

      const btnRect = toggleBtn.getBoundingClientRect();
      const centerX = btnRect.left + btnRect.width / 2;
      const isRightSide = centerX > window.innerWidth / 2;
      let sideTop = btnRect.top;
      let sideLeft;

      if (sideTop + this.sidebar.offsetHeight > window.innerHeight) {
        sideTop = window.innerHeight - this.sidebar.offsetHeight - 20;
      }

      if (isRightSide) {
        sideLeft = btnRect.left - this.sidebar.offsetWidth - 10;
      } else {
        sideLeft = btnRect.right + 10;
      }

      this.sidebar.style.left = `${sideLeft}px`;
      this.sidebar.style.top = `${sideTop}px`;
    };

    const hideSidebar = () => {
      hoverTimeout = setTimeout(() => {
        this.isSidebarOpen = false;
        this.sidebar.classList.remove('visible');
        toggleIcon.textContent = '☰';
        toggleBtn.style.opacity = '0.3';
      }, 300);
    };

    toggleBtn.addEventListener('mouseenter', showSidebar);
    toggleBtn.addEventListener('mouseleave', hideSidebar);
    this.sidebar.addEventListener('mouseenter', showSidebar);
    this.sidebar.addEventListener('mouseleave', hideSidebar);

    toggleBtn.addEventListener('mousedown', (e) => {
      isDragging = true;
      hasMoved = false;
      startY = e.clientY;
      startX = e.clientX;
      startTop = toggleBtn.offsetTop;
      startLeft = toggleBtn.offsetLeft;
      toggleBtn.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dy = e.clientY - startY;
      const dx = e.clientX - startX;

      if (!hasMoved && Math.sqrt(dx * dx + dy * dy) < 5) return;
      hasMoved = true;

      const newTop = Math.max(10, Math.min(window.innerHeight - 40, startTop + dy));
      const newLeft = Math.max(10, Math.min(window.innerWidth - 40, startLeft + dx));

      toggleBtn.style.top = `${newTop}px`;
      toggleBtn.style.left = `${newLeft}px`;

      if (this.isSidebarOpen) showSidebar();
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;

      isDragging = false;
      toggleBtn.style.cursor = 'grab';

      if (!hasMoved) return;

      const btnRect = toggleBtn.getBoundingClientRect();
      const centerX = btnRect.left + btnRect.width / 2;
      toggleBtn.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';

      if (centerX < window.innerWidth / 2) {
        toggleBtn.style.left = '0px';
        toggleBtn.classList.add('dock-left');
        toggleBtn.classList.remove('dock-right');
      } else {
        toggleBtn.style.left = `${window.innerWidth - toggleBtn.offsetWidth}px`;
        toggleBtn.classList.add('dock-right');
        toggleBtn.classList.remove('dock-left');
      }

      setTimeout(() => {
        toggleBtn.style.transition = 'opacity 0.3s ease, background 0.2s, width 0.2s';
        if (this.isSidebarOpen) showSidebar();
      }, 300);
    });

    toggleBtn.addEventListener('click', () => {
      if (isDragging || hasMoved) return;

      if (this.isSidebarOpen) {
        hideSidebar();
      } else {
        showSidebar();
      }
    });

    this.sidebar.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    this.sidebar.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.body.appendChild(toggleBtn);
  }

  createQuickActions() {
    const actions = document.createElement('div');
    actions.id = 'gn-quick-actions';
    actions.innerHTML = `
      <div class="gn-action-btn" id="gn-btn-up" title="Previous">↑</div>
      <div class="gn-action-btn" id="gn-btn-down" title="Next">↓</div>
      <div class="gn-divider"></div>
      <div class="gn-action-btn" id="gn-btn-top" title="Top">⇈</div>
      <div class="gn-action-btn" id="gn-btn-bottom" title="Bottom">⇊</div>
    `;

    document.body.appendChild(actions);

    document.getElementById('gn-btn-up').onclick = () => this.onNavigate(-1);
    document.getElementById('gn-btn-down').onclick = () => this.onNavigate(1);
    document.getElementById('gn-btn-top').onclick = () => this.scroll.scrollAll(true);
    document.getElementById('gn-btn-bottom').onclick = () => this.scroll.scrollAll(false);
  }

  updateMessageCount(count) {
    if (!this.messageCountBadge) return;

    try {
      if (count <= 0) {
        this.messageCountBadge.style.display = 'none';
        this.messageCountBadge.textContent = '0';
        this.toggleBtn.title = 'Toggle Context Navigator';
        return;
      }

      this.messageCountBadge.style.display = 'inline-flex';
      this.messageCountBadge.textContent = count > 99 ? '99+' : String(count);
      this.toggleBtn.title = `Toggle Context Navigator (${count} messages)`;
    } catch (error) {
      console.warn('Gemini Context Navigator: Error updating message count badge', error);
    }
  }

  renderMessages(messages) {
    try {
      this.updateMessageCount(messages.length);
      this.tocList.innerHTML = '';
      this.activeIndex = -1;

      if (messages.length === 0) {
        this.tocList.innerHTML = '<div style="padding:10px; opacity:0.6;">No messages found. <br><small>Try refreshing or scrolling.</small></div>';
        return;
      }

      messages.forEach((message, index) => {
        const item = document.createElement('div');
        item.className = 'gn-toc-item';
        item.dataset.index = index;

        const indexEl = document.createElement('span');
        indexEl.className = 'gn-index';
        indexEl.textContent = `#${index + 1}`;

        item.appendChild(indexEl);
        item.appendChild(document.createTextNode(` ${message.title}`));
        item.onclick = () => {
          this.scroll.scrollToElement(message.element);
          this.highlightActive(index, { scrollIntoView: true });
        };

        this.tocList.appendChild(item);
        this.injectPinButton(message.element, message.title);
      });
    } catch (error) {
      console.error('Gemini Context Navigator: Error rendering messages', error);
    }
  }

  injectPinButton(el, title) {
    try {
      if (el.querySelector('.gn-pin-btn')) return;

      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }

      const btn = document.createElement('span');
      btn.className = 'gn-pin-btn';
      btn.innerHTML = '📌';
      btn.title = 'Pin this message';
      btn.onclick = (e) => {
        e.stopPropagation();
        this.togglePin(el, title, btn);
      };

      el.appendChild(btn);
    } catch (error) {
      console.warn('Gemini Context Navigator: Error injecting pin button', error);
    }
  }

  togglePin(el, title, btn) {
    const isPinned = this.pinnedMessages.has(el);

    if (isPinned) {
      this.pinnedMessages.delete(el);
      btn.classList.remove('pinned');
    } else {
      this.pinnedMessages.add(el);
      btn.classList.add('pinned');
    }

    this.renderPinnedItems();
  }

  clearPins() {
    this.pinnedMessages.clear();
    this.renderPinnedItems();
  }

  renderPinnedItems() {
    try {
      this.pinnedItems.innerHTML = '';

      if (this.pinnedMessages.size === 0) {
        this.pinnedList.style.display = 'none';
        return;
      }

      this.pinnedList.style.display = 'block';
      this.pinnedMessages.forEach((el) => {
        let rawText = el.innerText.trim();
        rawText = GeminiNavigatorUtils.stripTitlePrefix(rawText, GeminiNavigatorConfig.titlePrefixes);
        const text = rawText.slice(0, GeminiNavigatorConfig.tocLength) +
          (rawText.length > GeminiNavigatorConfig.tocLength ? '...' : '');
        const item = document.createElement('div');
        item.className = 'gn-toc-item';
        item.textContent = `📌 ${text}`;
        item.onclick = () => this.scroll.scrollToElement(el);
        this.pinnedItems.appendChild(item);
      });
    } catch (error) {
      console.warn('Gemini Context Navigator: Error rendering pinned items', error);
    }
  }

  highlightActive(index, options = {}) {
    try {
      if (index < 0 || this.activeIndex === index) {
        if (options.scrollIntoView) {
          this.scrollActiveItemIntoView();
        }
        return;
      }

      const items = this.tocList.querySelectorAll('.gn-toc-item');
      items.forEach((item) => item.classList.remove('active'));

      if (items[index]) {
        items[index].classList.add('active');
        this.activeIndex = index;

        if (options.scrollIntoView) {
          this.scrollActiveItemIntoView();
        }
      }
    } catch (error) {
      console.warn('Gemini Context Navigator: Error highlighting active item', error);
    }
  }

  scrollActiveItemIntoView() {
    if (!this.isSidebarOpen || this.activeIndex < 0 || this.isUserBrowsingTOC) return;

    try {
      const activeItem = this.tocList.querySelector(
        `.gn-toc-item[data-index="${this.activeIndex}"]`
      );

      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (error) {
      console.warn('Gemini Context Navigator: Error scrolling active item into view', error);
    }
  }

  filterTOC(query) {
    try {
      const items = this.tocList.querySelectorAll('.gn-toc-item');
      const normalizedQuery = query.toLowerCase();

      items.forEach((item) => {
        item.style.display = item.innerText.toLowerCase().includes(normalizedQuery)
          ? 'block'
          : 'none';
      });
    } catch (error) {
      console.warn('Gemini Context Navigator: Error filtering TOC', error);
    }
  }
}
