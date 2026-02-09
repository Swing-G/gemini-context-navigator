/**
 * Gemini Context Navigator - Content Script
 * 
 * Features:
 * 1. Auto-Generated TOC
 * 2. Quick Jump Anchors
 * 3. Message Pinning
 * 4. In-Chat Search
 */

const CONFIG = {
  selectors: {
    // These selectors are heuristic and might need updates if Gemini changes
    // Strategy: Look for the main scroll container and message blocks
    scrollContainer: 'infinite-scroller, .scroll-container, main', 
    userMessage: '[data-test-id="user-query"], .user-query, .query-container',
    aiMessage: '[data-test-id="model-response"], .model-response, .response-container',
    // Fallback: generic blocks if specific IDs aren't found
    messageBlock: '.message-content, .conversation-turn'
  },
  tocLength: 50,
  defaultSettings: {
    tocLimit: 50,
    accentColor: '#ff80ab',
    bgColor: '#ffffff'
  }
};

class GeminiNavigator {
  constructor() {
    this.sidebar = null;
    this.tocList = null;
    this.messages = [];
    this.pinnedMessages = new Set();
    this.isSidebarOpen = false;
    this.settings = { ...CONFIG.defaultSettings };
    
    this.init();
  }

  init() {
    console.log('Gemini Context Navigator: Initializing...');
    this.loadSettings().then(() => {
        this.injectStyles();
        this.createUI();
        this.setupObservers();
        this.setupEventListeners();
        this.applySettings();
        
        // Initial scan
        setTimeout(() => this.scanMessages(), 2000);
    });
  }

  loadSettings() {
    return new Promise((resolve) => {
        if (chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(CONFIG.defaultSettings, (items) => {
                this.settings = items;
                resolve();
            });
        } else {
            resolve(); // Fallback for dev env without extension context
        }
    });
  }

  applySettings() {
      // Apply CSS variables
      const root = document.documentElement;
      
      // Convert hex to rgba for background to keep opacity
      const hexToRgba = (hex, alpha) => {
        let r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      if (this.settings.accentColor) {
          root.style.setProperty('--gn-accent-color', this.settings.accentColor);
      }
      if (this.settings.bgColor) {
          root.style.setProperty('--gn-bg-color', hexToRgba(this.settings.bgColor, 0.85));
      }
  }

  injectStyles() {
    // Styles are injected via manifest, but we can add dynamic overrides here if needed
  }

  createUI() {
    // 1. Sidebar
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'gemini-nav-sidebar';
    // Removed header with search and settings as requested
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

    // 2. Toggle Button
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'gn-toggle-btn';
    toggleBtn.innerHTML = '☰'; // Hamburger icon
    toggleBtn.title = 'Toggle Context Navigator';
    
    // Drag Logic
    let isDragging = false;
    let hasMoved = false; // Threshold flag
    let startY, startTop, startX, startLeft;
    let hoverTimeout;

    const showSidebar = () => {
        clearTimeout(hoverTimeout);
        this.isSidebarOpen = true;
        this.sidebar.classList.add('visible');
        toggleBtn.innerHTML = '×';
        toggleBtn.style.opacity = '1';
        
        // Position sidebar relative to button
        const btnRect = toggleBtn.getBoundingClientRect();
        const centerX = btnRect.left + btnRect.width / 2;
        const isRightSide = centerX > window.innerWidth / 2;
        
        let sideLeft, sideTop;
        
        sideTop = btnRect.top;
        
        // Clamp vertical
        if (sideTop + this.sidebar.offsetHeight > window.innerHeight) {
             sideTop = window.innerHeight - this.sidebar.offsetHeight - 20;
        }

        if (isRightSide) {
             // Button on right, sidebar on left
             sideLeft = btnRect.left - this.sidebar.offsetWidth - 10;
        } else {
             // Button on left, sidebar on right
             sideLeft = btnRect.right + 10;
        }
        
        this.sidebar.style.left = `${sideLeft}px`;
        this.sidebar.style.top = `${sideTop}px`;
    };

    const hideSidebar = () => {
        hoverTimeout = setTimeout(() => {
            this.isSidebarOpen = false;
            this.sidebar.classList.remove('visible');
            toggleBtn.innerHTML = '☰';
            toggleBtn.style.opacity = '0.3';
        }, 300); // 300ms delay to allow moving between button and sidebar
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
        
        // Threshold check (5px)
        if (!hasMoved && Math.sqrt(dx*dx + dy*dy) < 5) return;
        hasMoved = true;
        
        let newTop = startTop + dy;
        let newLeft = startLeft + dx;
        
        // Clamp to screen
        newTop = Math.max(10, Math.min(window.innerHeight - 40, newTop));
        newLeft = Math.max(10, Math.min(window.innerWidth - 40, newLeft));
        
        toggleBtn.style.top = `${newTop}px`;
        toggleBtn.style.left = `${newLeft}px`;
        
        // Update sidebar position if open while dragging
        if (this.isSidebarOpen) showSidebar();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            toggleBtn.style.cursor = 'grab';
            
            // Snap to Edge Logic
            if (hasMoved) {
                const btnRect = toggleBtn.getBoundingClientRect();
                const centerX = btnRect.left + btnRect.width / 2;
                
                // Animate snap
                toggleBtn.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
                
                if (centerX < window.innerWidth / 2) {
                    // Snap Left
                    toggleBtn.style.left = '0px'; // Tight snap
                    toggleBtn.classList.add('dock-left');
                    toggleBtn.classList.remove('dock-right');
                } else {
                    // Snap Right
                    toggleBtn.style.left = (window.innerWidth - toggleBtn.offsetWidth) + 'px'; // Tight snap
                    toggleBtn.classList.add('dock-right');
                    toggleBtn.classList.remove('dock-left');
                }
                
                // Reset transition after snap
                setTimeout(() => {
                    toggleBtn.style.transition = 'opacity 0.3s ease, background 0.2s, width 0.2s';
                    // Re-calculate sidebar position after snap
                    if (this.isSidebarOpen) showSidebar();
                }, 300);
            }
        }
    });

    // Click handler (distinguish from drag)
    toggleBtn.addEventListener('click', (e) => {
        // Only toggle if we didn't drag significantly
        if (!isDragging && !hasMoved) {
             if (this.isSidebarOpen) hideSidebar(); 
             else showSidebar();
        }
    });

    // Stop propagation on sidebar click to prevent it from closing or dragging logic interference
    this.sidebar.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    
    // Also stop click propagation
    this.sidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    document.body.appendChild(toggleBtn);

    // 3. Quick Actions
    const actions = document.createElement('div');
    actions.id = 'gn-quick-actions';
    // Use Material Symbols-like text or SVG if possible, for now simple arrows
    actions.innerHTML = `
      <div class="gn-action-btn" id="gn-btn-up" title="Previous">↑</div>
      <div class="gn-action-btn" id="gn-btn-down" title="Next">↓</div>
      <div class="gn-divider"></div>
      <div class="gn-action-btn" id="gn-btn-top" title="Top">⇈</div>
      <div class="gn-action-btn" id="gn-btn-bottom" title="Bottom">⇊</div>
    `;
    document.body.appendChild(actions);

    // Bind actions
    document.getElementById('gn-btn-up').onclick = () => this.navigate(-1);
    document.getElementById('gn-btn-down').onclick = () => this.navigate(1);
    
    // Fix Scroll: Brute-force approach
    // Gemini often has multiple nested scroll containers. 
    // We will try to scroll the window AND the most likely container.
    const scrollAll = (top) => {
        // 1. Try Window
        window.scrollTo({ top: top ? 0 : document.body.scrollHeight, behavior: 'smooth' });
        
        // 2. Try all potential scroll containers
        const candidates = document.querySelectorAll('main, infinite-scroller, .scroll-container, [class*="scroll"]');
        candidates.forEach(el => {
            try {
                // Check if it actually has scrollable content
                if (el.scrollHeight > el.clientHeight) {
                     el.scrollTo({ top: top ? 0 : el.scrollHeight, behavior: 'smooth' });
                }
            } catch(e) {}
        });
    };

    document.getElementById('gn-btn-top').onclick = () => scrollAll(true);
    document.getElementById('gn-btn-bottom').onclick = () => scrollAll(false);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.sidebar.classList.toggle('visible', this.isSidebarOpen);
    const btn = document.getElementById('gn-toggle-btn');
    btn.innerHTML = this.isSidebarOpen ? '×' : '☰';
  }

  setupObservers() {
    // Observe DOM changes to detect new messages
    const observer = new MutationObserver(_.debounce(() => {
      this.scanMessages();
    }, 500)); // Debounce to avoid performance hit

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Scroll Spy removed as per user request
  }
  
  setupEventListeners() {
      // Re-scan on URL change (SPA navigation)
      let lastUrl = location.href; 
      new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
          lastUrl = url;
          // Clear pins on conversation switch
          this.pinnedMessages.clear();
          this.renderPinnedItems();
          this.scanMessages();
        }
      }).observe(document, {subtree: true, childList: true});
  }

  scanMessages() {
    // Heuristic to find message blocks. 
    // We try multiple selectors to be robust.
    let elements = document.querySelectorAll(CONFIG.selectors.userMessage);
    
    // If specific selectors fail, try a more generic approach (looking for conversation turns)
    if (elements.length === 0) {
        // Strategy 2: Look for 'user-query' in classList (looser match)
        const allDivs = document.querySelectorAll('div');
        const userQueryDivs = Array.from(allDivs).filter(div => 
            div.className.includes && div.className.includes('user-query')
        );
        if (userQueryDivs.length > 0) {
            elements = userQueryDivs;
        }
    }

    if (elements.length === 0) {
        // Strategy 3: Look for user avatars/icons and get their parent container
        // This is risky but might work if classes are obfuscated
        const imgs = document.querySelectorAll('img[src*="googleusercontent"]');
        const potentialMessages = [];
        imgs.forEach(img => {
             // Heuristic: Go up a few levels to find the message container
             let parent = img.parentElement;
             for(let i=0; i<5; i++) {
                 if (!parent) break;
                 // If text content is long enough, assume it's a message
                 if (parent.innerText && parent.innerText.length > 5) {
                     potentialMessages.push(parent);
                     break;
                 }
                 parent = parent.parentElement;
             }
        });
        if (potentialMessages.length > 0) elements = potentialMessages;
    }

    // Calculate hash to detect changes
    const newHash = elements.length + ':' + (elements.length > 0 ? elements[elements.length - 1].innerText.length : 0);

    // If nothing changed, don't rebuild the list to preserve scroll/state
    if (this.lastHash === newHash && this.messages.length > 0) return;
    this.lastHash = newHash;

    // Clear current list to rebuild (or intelligent diffing in v2)
    this.messages = [];
    this.tocList.innerHTML = '';

    if (elements.length === 0) {
        // Show empty state
        this.tocList.innerHTML = '<div style="padding:10px; opacity:0.6;">No messages found. <br><small>Try refreshing or scrolling.</small></div>';
        return;
    }

    // Always show all items in the list, but let CSS scroll handle the view limit
    // We only limit the total number of items stored in memory if it's too huge
    const limit = parseInt(this.settings.tocLimit) || 0;
    if (limit > 0 && elements.length > limit) {
         elements = Array.from(elements).slice(elements.length - limit);
    }

    elements.forEach((el, index) => {
      // Extract text
      const text = el.innerText.trim();
      if (!text) return;

      const title = text.slice(0, CONFIG.tocLength) + (text.length > CONFIG.tocLength ? '...' : '');
      
      this.messages.push({
        element: el,
        title: title,
        index: index
      });

      // Create TOC item
      const item = document.createElement('div');
      item.className = 'gn-toc-item';
      item.dataset.index = index;
      item.innerHTML = `<span class="gn-index">#${index + 1}</span> ${title}`;
      item.onclick = () => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightActive(index);
      };
      
      this.tocList.appendChild(item);
      
      // Add Pin button to the message itself if not present
      this.injectPinButton(el, title);
    });
  }

  injectPinButton(el, title) {
    if (el.querySelector('.gn-pin-btn')) return;

    // Ensure parent is relative for absolute positioning of pin
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

    // Try to append to a header or the element itself
    el.appendChild(btn);
  }

  togglePin(el, title, btn) {
    const isPinned = this.pinnedMessages.has(el);
    if (isPinned) {
      this.pinnedMessages.delete(el);
      btn.classList.remove('pinned');
      this.renderPinnedItems();
    } else {
      this.pinnedMessages.add(el);
      btn.classList.add('pinned');
      this.renderPinnedItems();
    }
  }

  renderPinnedItems() {
    this.pinnedItems.innerHTML = '';
    if (this.pinnedMessages.size > 0) {
      this.pinnedList.style.display = 'block';
      this.pinnedMessages.forEach(el => {
        const text = el.innerText.slice(0, 20) + '...';
        const item = document.createElement('div');
        item.className = 'gn-toc-item';
        item.innerHTML = `📌 ${text}`;
        item.onclick = () => el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.pinnedItems.appendChild(item);
      });
    } else {
      this.pinnedList.style.display = 'none';
    }
  }

  navigate(direction) {
    // Find currently visible message
    const viewMiddle = window.scrollY + window.innerHeight / 2;
    let currentIndex = -1;

    // Simple proximity check
    for (let i = 0; i < this.messages.length; i++) {
        const rect = this.messages[i].element.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        if (absoluteTop >= window.scrollY) {
            currentIndex = i;
            break;
        }
    }
    
    if (currentIndex === -1) currentIndex = this.messages.length - 1;

    let targetIndex = currentIndex + direction;
    // Clamp
    targetIndex = Math.max(0, Math.min(targetIndex, this.messages.length - 1));
    
    const target = this.messages[targetIndex];
    if (target) {
        target.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  updateActiveTOC() {
     // Disabled as per request
  }

  highlightActive(index) {
      const items = this.tocList.querySelectorAll('.gn-toc-item');
      items.forEach(item => item.classList.remove('active'));
      if (items[index]) {
          items[index].classList.add('active');
          // Removed scrollIntoView to prevent auto-scrolling the list when user is browsing manually
          // items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
  }

  filterTOC(query) {
      const items = this.tocList.querySelectorAll('.gn-toc-item');
      query = query.toLowerCase();
      items.forEach(item => {
          if (item.innerText.toLowerCase().includes(query)) {
              item.style.display = 'block';
          } else {
              item.style.display = 'none';
          }
      });
  }
}

// Lodash-like helpers for debounce/throttle to avoid dependency
const _ = {
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Initialize
new GeminiNavigator();
