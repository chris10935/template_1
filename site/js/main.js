// shared helpers
(() => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// mobile nav toggle
(() => {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  const openMenu = () => {
    menu.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("click", () => closeMenu());
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });
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
    return `I can help with:\n• Practice areas and consultation steps\n• Typical timelines and process\n• Fee structure overview (varies by matter)\n\nTip: enable “Use RAG retrieval” to search your CSV knowledge base.`;
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
    "Hi—ask me about practice areas, consultations, and what to expect. Toggle RAG to retrieve answers from your CSV files.",
  );
})();
