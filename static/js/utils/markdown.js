/**
 * Simple Markdown parser for GigaChat tips
 * Supports: headers, bold, italic, lists, links, code, pre
 */

export function renderMarkdown(md) {
  if (!md) return '';

  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')

    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')

    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

    // Unordered lists
    .replace(/^[\*\-\+] (.+)$/gm, '<li>$1</li>')

    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

    // Paragraphs (simple heuristic)
    .replace(/\n\n+/g, '</p><p>')

    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap lists
  html = html.replace(/(<li>.*?<\/li>)(?!\s*<li>)/gs, (match) => {
    if (match.includes('<ul>') || match.includes('<ol>')) return match;
    return '<ul>' + match + '</ul>';
  });

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');

  // Wrap in container if not already wrapped
  if (!html.startsWith('<h') && !html.startsWith('<p') && !html.startsWith('<ul') && !html.startsWith('<ol')) {
    html = '<p>' + html + '</p>';
  }

  return html;
}