/**
 * RAG Starter (NO API)
 * - Loads business.csv and faq_kb.csv
 * - Builds a simple TF-IDF index (client-side)
 * - Retrieves top-k matching rows for a user query
 * - Returns a retrieval-based “assistant answer” plus source chips
 *
 * This is NOT a generative model.
 * Plug-in point for local generation is marked in buildAnswer().
 */

window.RAG = (() => {
  const STOP = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "if",
    "then",
    "else",
    "when",
    "what",
    "how",
    "why",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "at",
    "by",
    "from",
    "as",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "we",
    "you",
    "your",
  ]);

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t && t.length > 1 && !STOP.has(t));
  }

  function parseCSV(csvText) {
    // Simple CSV parser (handles quoted fields)
    const rows = [];
    let i = 0,
      field = "",
      row = [],
      inQuotes = false;

    const pushField = () => {
      row.push(field);
      field = "";
    };
    const pushRow = () => {
      rows.push(row);
      row = [];
    };

    while (i < csvText.length) {
      const c = csvText[i];

      if (c === '"') {
        if (inQuotes && csvText[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
        i++;
        continue;
      }

      if (!inQuotes && c === ",") {
        pushField();
        i++;
        continue;
      }
      if (!inQuotes && (c === "\n" || c === "\r")) {
        // handle CRLF
        if (c === "\r" && csvText[i + 1] === "\n") i++;
        pushField();
        pushRow();
        i++;
        continue;
      }

      field += c;
      i++;
    }
    // last
    if (field.length || row.length) {
      pushField();
      pushRow();
    }

    const header = rows.shift().map((h) => h.trim());
    return rows
      .filter((r) => r.some((x) => String(x).trim().length))
      .map((r) => {
        const obj = {};
        header.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
        return obj;
      });
  }

  function tfidfBuild(docs) {
    // docs: [{id, text, meta}]
    const N = docs.length;
    const docTF = [];
    const df = new Map();

    docs.forEach((d) => {
      const tokens = tokenize(d.text);
      const tf = new Map();
      tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
      docTF.push(tf);

      const seen = new Set(tokens);
      seen.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
    });

    const idf = new Map();
    df.forEach((val, term) => {
      // smooth
      idf.set(term, Math.log((N + 1) / (val + 1)) + 1);
    });

    // Build sparse vectors and norms
    const vectors = docs.map((d, idx) => {
      const tf = docTF[idx];
      let norm = 0;
      const vec = new Map();
      tf.forEach((count, term) => {
        const w = (1 + Math.log(count)) * (idf.get(term) || 0);
        vec.set(term, w);
        norm += w * w;
      });
      return { vec, norm: Math.sqrt(norm) || 1, doc: d };
    });

    return { vectors, idf, N };
  }

  function cosineSim(qVec, qNorm, dVec, dNorm) {
    let dot = 0;
    qVec.forEach((wq, term) => {
      const wd = dVec.get(term);
      if (wd) dot += wq * wd;
    });
    return dot / ((qNorm || 1) * (dNorm || 1));
  }

  function buildQueryVec(query, idf) {
    const tokens = tokenize(query);
    const tf = new Map();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));

    let norm = 0;
    const vec = new Map();
    tf.forEach((count, term) => {
      const w = (1 + Math.log(count)) * (idf.get(term) || 0);
      vec.set(term, w);
      norm += w * w;
    });
    return { vec, norm: Math.sqrt(norm) || 1 };
  }

  function buildAnswer(query, hits) {
    // Retrieval-first answer template
    if (!hits.length) {
      return {
        answer: `I didn’t find a strong match in the CSV knowledge base.\n
Try:\n• using more specific keywords (e.g., “consultation”, “fees”, “custody”, “real estate”)\n• adding more rows to data/faq_kb.csv or data/business.csv`,
        sources: [],
      };
    }

    const top = hits[0];
    const lines = hits.map((h, i) => {
      const m = h.doc.meta;
      if (m.type === "faq") return `${i + 1}) FAQ: ${m.topic} — ${m.content}`;
      if (m.type === "business")
        return `${i + 1}) ${m.name} (${m.category}) — ${m.summary}`;
      return `${i + 1}) ${h.doc.text}`;
    });

    // Plug-in point for a local LLM (optional, not included):
    // - Take the retrieved `lines` and pass them into an on-device model via:
    //   - llama.cpp (server you run locally)
    //   - WebLLM (in-browser) if you choose
    // This template intentionally avoids APIs.

    return {
      answer: `Here’s what I found in the knowledge base:\n\n${lines.join("\n\n")}\n\nIf you want, tell me which part you want to act on (fees, timeline, practice area, or a specific service).`,
      sources: hits.map((h) => h.sourceLabel),
    };
  }

  async function init({ businessCsvPath, faqCsvPath }) {
    const [bizRaw, faqRaw] = await Promise.all([
      fetch(businessCsvPath).then((r) => r.text()),
      fetch(faqCsvPath).then((r) => r.text()),
    ]);

    const biz = parseCSV(bizRaw);
    const faq = parseCSV(faqRaw);

    const docs = [];

    biz.forEach((b) => {
      const text = [
        b.name,
        b.category,
        b.summary,
        b.offerings,
        b.keywords,
        b.city,
        b.state,
      ]
        .filter(Boolean)
        .join(" ");
      docs.push({
        id: `biz_${b.id || b.name}`,
        text,
        meta: { type: "business", ...b },
      });
    });

    faq.forEach((f) => {
      const text = [f.topic, f.content, f.tags].filter(Boolean).join(" ");
      docs.push({
        id: `faq_${f.id || f.topic}`,
        text,
        meta: { type: "faq", ...f },
      });
    });

    const index = tfidfBuild(docs);
    return { index, docs };
  }

  function query(state, userQuery, { k = 3 } = {}) {
    const { index } = state;
    const { vec: qVec, norm: qNorm } = buildQueryVec(userQuery, index.idf);

    const scored = index.vectors
      .map((v) => {
        const score = cosineSim(qVec, qNorm, v.vec, v.norm);
        const m = v.doc.meta;
        const label =
          m.type === "faq"
            ? `FAQ: ${m.topic || "entry"}`
            : m.type === "business"
              ? `Biz: ${m.name || "entry"}`
              : `Doc: ${v.doc.id}`;
        return { score, doc: v.doc, sourceLabel: label };
      })
      .sort((a, b) => b.score - a.score);

    const hits = scored.filter((x) => x.score > 0.08).slice(0, k); // threshold avoids noise
    return buildAnswer(userQuery, hits);
  }

  return { init, query };
})();
