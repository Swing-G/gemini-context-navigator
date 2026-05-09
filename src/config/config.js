const GeminiNavigatorConfig = {
  selectors: {
    scrollContainer: 'infinite-scroller, .scroll-container, main',
    conversationContainer: 'infinite-scroller, .conversation-container, main, [role="main"]',
    userMessage: '[data-test-id="user-query"], .user-query, .query-container',
    aiMessage: '[data-test-id="model-response"], .model-response, .response-container',
    messageBlock: '.message-content, .conversation-turn'
  },
  tocLength: 50,
  defaultSettings: {
    tocLimit: 50,
    accentColor: '#ff80ab',
    bgColor: '#ffffff'
  }
};
