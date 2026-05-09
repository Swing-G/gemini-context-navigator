class GeminiNavigatorScanner {
  constructor(config) {
    this.config = config;
    this.lastHash = '';
  }

  findUserMessageElements() {
    try {
      let elements = document.querySelectorAll(this.config.selectors.userMessage);

      if (elements.length === 0) {
        const allDivs = document.querySelectorAll('div');
        const userQueryDivs = Array.from(allDivs).filter((div) =>
          div.className.includes && div.className.includes('user-query')
        );

        if (userQueryDivs.length > 0) {
          elements = userQueryDivs;
        }
      }

      if (elements.length === 0) {
        const imgs = document.querySelectorAll('img[src*="googleusercontent"]');
        const potentialMessages = [];

        imgs.forEach((img) => {
          let parent = img.parentElement;

          for (let i = 0; i < 5; i += 1) {
            if (!parent) break;

            if (parent.innerText && parent.innerText.length > 5) {
              potentialMessages.push(parent);
              break;
            }

            parent = parent.parentElement;
          }
        });

        if (potentialMessages.length > 0) {
          elements = potentialMessages;
        }
      }

      return elements;
    } catch (error) {
      console.warn('Gemini Context Navigator: Error finding user messages', error);
      return [];
    }
  }

  hasChanged(elements, existingMessageCount) {
    try {
      const snippetLen = 30;
      const fingerprint = Array.from(elements)
        .map((el) => el.innerText.slice(0, snippetLen))
        .join('|');

      const newHash = `${elements.length}:${GeminiNavigatorUtils.simpleHash(fingerprint)}`;

      if (this.lastHash === newHash && existingMessageCount > 0) {
        return false;
      }

      this.lastHash = newHash;
      return true;
    } catch (error) {
      console.warn('Gemini Context Navigator: Error checking changes', error);
      return true;
    }
  }

  buildMessages(elements, settings) {
    try {
      let candidates = elements;
      const limit = parseInt(settings.tocLimit, 10) || 0;

      if (limit > 0 && candidates.length > limit) {
        candidates = Array.from(candidates).slice(candidates.length - limit);
      }

      return Array.from(candidates).reduce((messages, el, index) => {
        const text = el.innerText.trim();
        if (!text) return messages;

        const title =
          text.slice(0, this.config.tocLength) +
          (text.length > this.config.tocLength ? '...' : '');

        messages.push({
          element: el,
          title,
          index
        });

        return messages;
      }, []);
    } catch (error) {
      console.error('Gemini Context Navigator: Error building messages', error);
      return [];
    }
  }
}
