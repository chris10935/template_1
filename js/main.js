// shared helpers
(() => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// chat widget wiring (uses rag.js)
(() => {
  const fab = document.getElementById("chatFab");
  const panel = document.getElementById("chatPanel");
  const closeBtn = document.getElementById("chatClose");
  const body = document.getElementById("chatBody");
  const input = document.getElementById("chatInput");
  const send = document.getElementById("chatSend");
  const toggle = document.getElementById("ragToggle");
  const openFromHero = document.getElementById("openChatFromHero");

  if (!fab || !panel || !body || !input || !send || !toggle) return;

  const show = () => {
    panel.style.display = "block";
    panel.setAttribute("aria-hidden", "false");
    input.focus();
  };
  const hide = () => {
    panel.style.display = "none";
    panel.setAttribute("aria-hidden", "true");
  };

  const addMsg = (role, text, sources = []) => {
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;
    const bub = document.createElement("div");
    bub.className = "bubble";
    bub.textContent = text;

    wrap.appendChild(bub);

    if (sources && sources.length) {
      const s = document.createElement("div");
      s.className = "sources";
      s.innerHTML = sources
        .map((x) => `<span class="source-chip">${escapeHtml(x)}</span>`)
        .join("");
      bub.appendChild(s);
    }

    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  };

  const escapeHtml = (str) =>
    String(str).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );

  const defaultReply = () => {
    return `I can help with:\n• Services + pricing (placeholder)\n• Timeline + process\n• What’s included in the Launch/Growth/Enterprise tiers\n\nTip: enable “Use RAG retrieval” to search your CSV knowledge base.`;
  };

  // Load RAG index (business.csv + faq_kb.csv)
  let ragReady = false;
  let ragState = null;

  window.RAG.init({
    businessCsvPath: "data/business.csv",
    faqCsvPath: "data/faq_kb.csv",
  })
    .then((state) => {
      ragState = state;
      ragReady = true;
    })
    .catch(() => {
      ragReady = false;
    });

  const handle = async () => {
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    addMsg("user", q);

    const useRag = !!toggle.checked;

    if (useRag && ragReady && ragState) {
      const out = window.RAG.query(ragState, q, { k: 3 });
      addMsg("assistant", out.answer, out.sources);
    } else {
      addMsg("assistant", defaultReply());
    }
  };

  fab.addEventListener("click", show);
  if (openFromHero) openFromHero.addEventListener("click", show);
  closeBtn.addEventListener("click", hide);
  send.addEventListener("click", handle);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handle();
  });

  // initial greeting
  addMsg(
    "assistant",
    "Hi—ask me anything about this template. Toggle RAG to retrieve answers from your CSV files.",
  );
})();
