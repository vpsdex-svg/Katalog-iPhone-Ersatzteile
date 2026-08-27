import React from 'react';

// Einfaches Inline-Format für die Hinweis-Leiste im Katalog.
// Unterstützt:
//   **fett**            → <strong>
//   *kursiv*            → <em>
//   [Text]{rot}         → farbiger Text (Name oder Hex wie #e11d48)
//   Emojis (🚚 ⚡ …)     → direkt einfügen, funktionieren nativ
// Beispiel:
//   🚚 [Lieferung]{#e11d48} zum Festpreis – **nur 10 €** deutschlandweit

const TOKEN_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]*\]\{[^}]+\})/g;

export function formatNotice(text) {
  if (!text) return null;
  const parts = String(text).split(TOKEN_RE).filter((p) => p !== undefined && p !== '');
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const m = part.match(/^\[([^\]]*)\]\{([^}]+)\}$/);
    if (m) {
      return <span key={i} style={{ color: m[2].trim() }}>{m[1]}</span>;
    }
    return part;
  });
}

// Fügt einen Schnellbaustein an die aktuelle Cursor-Position ein.
export function insertNoticeSnippet(current, snippet) {
  return current ? `${current}${current.endsWith(' ') || snippet.startsWith(' ') ? '' : ' '}${snippet}` : snippet;
}
