class GeminiNavigatorExporter {
  exportMarkdown(conversation, exportedAt) {
    const dateStr = this._formatDisplayTime(exportedAt);
    let md = `# Gemini Conversation (${dateStr})\n\n`;

    for (const turn of conversation) {
      if (turn.role === 'user') {
        md += `**👤 You:**\n${turn.content}\n\n`;
      } else {
        md += `**🤖 Gemini:**\n${turn.content}\n\n`;
      }
    }

    return md;
  }

  exportJSON(conversation, exportedAt) {
    return JSON.stringify(
      {
        exportedAt: exportedAt.toISOString(),
        title: 'Gemini Conversation',
        turns: conversation
      },
      null,
      2
    );
  }

  download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getFilename(format) {
    const now = new Date();
    const ext = format === 'md' ? 'md' : 'json';
    return `gemini-conversation-${this._formatCompactTime(now)}.${ext}`;
  }

  _formatDisplayTime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  }

  _formatCompactTime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}-${h}${min}`;
  }
}
