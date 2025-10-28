// app.js
// Carrega ./json/data.json e injeta conteúdos nas áreas já existentes do HTML
// Não modifica classes/nodes existentes (apenas cria filhos dentro deles).

(function () {
  const JSON_PATH = "./json/data.json";

  // guarda conteúdo original do player para restaurar mais tarde
  const videoDialog = document.getElementById("videoDialog");
  const videoWrapEl = videoDialog ? videoDialog.querySelector(".video-wrap") : null;
  const originalVideoWrapHTML = videoWrapEl ? videoWrapEl.innerHTML : "";

  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  async function loadCourse() {
    try {
      const res = await fetch(JSON_PATH);
      if (!res.ok) throw new Error("Falha ao carregar JSON");
      const data = await res.json();
      const courses = Array.isArray(data) ? data : [data];

      const id = getParam("id");
      let course = id ? courses.find(c => String(c.id) === String(id)) : courses[0];
      if (!course) course = courses[0];
      if (!course) {
        console.error("Nenhum curso encontrado no JSON");
        return;
      }

      // Atualiza títulos/descrição sem tocar na estrutura
      const courseDetailsTitle = document.querySelector(".course-details h2");
      if (courseDetailsTitle) courseDetailsTitle.textContent = course.name || course.id || "Curso";

      // se quiser mostrar descrição coloque onde for apropriado (há um comentário na sua HTML)
      const bannerTitle = document.querySelector(".course-banner h2");
      if (bannerTitle) bannerTitle.textContent = course.description || course.name || bannerTitle.textContent;

      // renderiza Matemática (preenche .lessons-list dentro de #aula-atual)
      const math = (course.materials && course.materials.matematica) ? course.materials.matematica : {};
      fillMathLessons(math);

      // renderiza Física (preenche #atividades)
      const phys = (course.materials && course.materials.fisica) ? course.materials.fisica : {};
      fillPhysicsActivities(phys);

      // renderiza Recursos (anexa itens em #recursos sem remover os existentes)
      fillRecursos(math, phys);

      // atualiza imagens na área left-content -> image-section -> .video-grid (apende thumbnails)
      fillImageGrid(math);

      // atualiza transcrição (se existir no JSON)
      if (course.transcript) {
        const tr = document.querySelector(".transcript-text");
        if (tr) tr.textContent = course.transcript;
      }
    } catch (err) {
      console.error("Erro ao carregar o curso:", err);
    }
  }

  // ----- Helpers de renderização -----

  // Cria um elemento .lesson-item com a mesma estrutura que estava no seu HTML
  function createLessonItem(title, onClick, isActive = false) {
    const div = document.createElement("div");
    div.className = "lesson-item" + (isActive ? " active" : "");
    div.setAttribute("role", "button");
    div.tabIndex = 0;

    // SVG play icon (reuso similar ao HTML original)
    div.innerHTML = `
      <svg class="play-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5,3 19,12 5,21"/>
      </svg>
      <span class="lesson-name"></span>
    `;
    const span = div.querySelector(".lesson-name");
    span.textContent = title;

    // completion-dot only if active
    if (isActive) {
      const dot = document.createElement("div");
      dot.className = "completion-dot";
      div.appendChild(dot);
    }

    div.addEventListener("click", onClick);
    div.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } });

    return div;
  }

  // Popula .lessons-list (Matemática)
  function fillMathLessons(math) {
    const lessonsList = document.querySelector("#aula-atual .lessons-list");
    if (!lessonsList) return;

    // limpa só os itens filhos para manter wrapper .lesson-card/.lesson-header
    lessonsList.innerHTML = "";

    const videos = Array.isArray(math.videos) ? math.videos : [];
    if (videos.length === 0) {
      // se não tiver vídeos, mantém 3 itens padrão (ou exibe mensagem)
      const empty = document.createElement("div");
      empty.className = "empty-note";
      empty.textContent = "Nenhum vídeo cadastrado para Matemática.";
      lessonsList.appendChild(empty);
    } else {
      videos.forEach((url, i) => {
        const title = extractFriendlyTitle(url, `Aula ${i + 1}`);
        const isActive = i === 0;
        const item = createLessonItem(title, () => openMedia(url, title), isActive);
        lessonsList.appendChild(item);
      });
    }
  }

  // Popula #atividades com .activity-item (Física)
  function fillPhysicsActivities(phys) {
    const atividades = document.getElementById("atividades");
    if (!atividades) return;

    // vamos substituir o conteúdo interno por itens gerados (mantendo a div #atividades e classes)
    atividades.innerHTML = "";

    // preferir vídeos, depois textos
    const videos = Array.isArray(phys.videos) ? phys.videos : [];
    const textos = Array.isArray(phys.textos) ? phys.textos : [];

    if (videos.length === 0 && textos.length === 0) {
      // se não houver conteúdo, manter itens que já existiam (ex.: Mecânica...) — como você pediu manter o design,
      // aqui adiciono seções padrão (como no HTML original) para não deixar vazio.
      const presets = [
        "Mecânica",
        "Biomecânica",
        "Termoterapia e crioterapia"
      ];
      presets.forEach(name => atividades.appendChild(createActivityItem(name)));
      return;
    }

    // adiciona vídeos como atividades
    videos.forEach((url, i) => {
      const title = extractFriendlyTitle(url, `Vídeo ${i + 1}`);
      const el = createActivityItem(title, () => openMedia(url, title));
      atividades.appendChild(el);
    });

    // adiciona textos como atividades (se existirem)
    textos.forEach((url, i) => {
      const title = extractFriendlyTitle(url, `Texto ${i + 1}`);
      const el = createActivityItem(title, () => openLink(url));
      atividades.appendChild(el);
    });
  }

  // cria a structure .activity-item > .activity-info > svg + span (igual ao seu HTML)
  function createActivityItem(text, onClick) {
    const wrap = document.createElement("div");
    wrap.className = "activity-item";

    const info = document.createElement("div");
    info.className = "activity-info";
    info.setAttribute("role", onClick ? "button" : "text");
    info.tabIndex = 0;

    // SVG igual ao seu HTML
    info.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
      <span></span>
    `;
    const span = info.querySelector("span");
    span.textContent = text;

    if (onClick) {
      info.addEventListener("click", onClick);
      info.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } });
    }

    wrap.appendChild(info);
    return wrap;
  }

  // Preenche #recursos (anexa itens mantendo os que já existem)
  function fillRecursos(math, phys) {
    const recursos = document.getElementById("recursos");
    if (!recursos) return;

    // anexar textos / podcasts / imagens de matemática e física como .resource-item (mantendo a mesma classe)
    const appendResource = (label, url, kind) => {
      const item = document.createElement("div");
      item.className = "resource-item";
      // inner SVG similar ao seu HTML (document icon)
      item.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        <span class="resource-label"></span>
      `;
      const span = item.querySelector(".resource-label");
      span.textContent = `${label}`;

      item.addEventListener("click", () => {
        if (kind === "video") openMedia(url, label);
        else openLink(url);
      });

      recursos.appendChild(item);
    };

    const mats = Array.isArray(math.textos) ? math.textos : [];
    mats.forEach((u, i) => appendResource(`Matématica • Texto ${i + 1}`, u, "link"));
    const mimgs = Array.isArray(math.imagens) ? math.imagens : [];
    mimgs.forEach((u, i) => appendResource(`Matématica • Imagem ${i + 1}`, u, "image"));
    const mpod = Array.isArray(math.podcasts) ? math.podcasts : [];
    mpod.forEach((u, i) => appendResource(`Matématica • Podcast ${i + 1}`, u, "link"));

    // física
    const ftexts = Array.isArray(phys.textos) ? phys.textos : [];
    ftexts.forEach((u, i) => appendResource(`Física • Texto ${i + 1}`, u, "link"));
    const fimgs = Array.isArray(phys.imagens) ? phys.imagens : [];
    fimgs.forEach((u, i) => appendResource(`Física • Imagem ${i + 1}`, u, "image"));
    const fpod = Array.isArray(phys.podcasts) ? phys.podcasts : [];
    fpod.forEach((u, i) => appendResource(`Física • Podcast ${i + 1}`, u, "link"));
  }

  // Preenche a .video-grid com thumbnails (apendando sem remover o que já existe)
  function fillImageGrid(math) {
    const grid = document.querySelector(".image-section .video-grid");
    if (!grid) return;
    const imgs = Array.isArray(math.imagens) ? math.imagens : [];
    if (!imgs || imgs.length === 0) return;

    imgs.forEach((src, i) => {
      const cell = document.createElement("div");
      // reaproveitamos as classes que já aparecem no HTML (light/medium)
      cell.className = "grid-cell light";
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Imagem ${i + 1}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      // abrir em nova aba ao clicar
      img.addEventListener("click", () => window.open(src, "_blank", "noopener"));
      cell.appendChild(img);
      grid.appendChild(cell);
    });
  }

  // ----- Abertura de mídia -----

  // Decide como abrir dependente do URL: youtube -> iframe no dialog, mp4 -> video tag, outros -> nova aba
  function openMedia(url, title) {
    if (!videoDialog || !videoWrapEl) {
      // fallback: abrir em nova aba
      openLink(url);
      return;
    }

    // limpa container
    const container = videoWrapEl;
    container.innerHTML = "";

    // YouTube detection
    if (/youtube\.com|youtu\.be/i.test(url)) {
      const videoId = extractYoutubeId(url);
      const iframe = document.createElement("iframe");
      iframe.width = "100%";
      iframe.height = "480";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.src = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0` : url;
      container.appendChild(iframe);
      setDialogTitle(title);
      videoDialog.showModal();
      return;
    }

    // mp4/webm/ogg
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
      // cria <video> dinamicamente (mantendo funcionalidade)
      const videoEl = document.createElement("video");
      videoEl.controls = true;
      videoEl.playsInline = true;
      videoEl.style.width = "100%";
      videoEl.src = url;
      container.appendChild(videoEl);
      setDialogTitle(title);
      videoDialog.showModal();
      return;
    }

    // padrão: abrir em nova aba
    openLink(url);
  }

  function setDialogTitle(t) {
    const tEl = document.getElementById("videoTitle");
    if (tEl) tEl.textContent = t || "Aula";
  }

  function openLink(url) {
    window.open(url, "_blank", "noopener");
  }

  // restore original video wrap on dialog close
  function setupDialogCleanup() {
    if (!videoDialog || !videoWrapEl) return;
    videoDialog.addEventListener("close", () => {
      // restaura o HTML original do videoWrap (isso garante que o <video id="videoPlayer"> original volte)
      videoWrapEl.innerHTML = originalVideoWrapHTML;
      // também limpa o <source> se existir
      const srcEl = document.getElementById("videoSrc");
      if (srcEl) srcEl.src = "";
      const vid = document.getElementById("videoPlayer");
      if (vid) {
        try { vid.load(); } catch (e) { /* ignore */ }
      }
      setDialogTitle("Aula");
    });
  }

  // ----- utilitários -----
  function extractFriendlyTitle(url, fallback) {
    try {
      const u = new URL(url);
      const name = decodeURIComponent(u.pathname.split("/").pop() || "");
      return name || (u.searchParams.get("v") ? `Vídeo ${u.searchParams.get("v")}` : fallback);
    } catch (e) {
      return fallback;
    }
  }

  function extractYoutubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      // caso embed path
      const parts = u.pathname.split("/");
      return parts.includes("embed") ? parts.pop() : null;
    } catch (e) {
      const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      return m ? m[1] : null;
    }
  }

  // inicialização
  document.addEventListener("DOMContentLoaded", () => {
    setupDialogCleanup();
    loadCourse();
  });
})();
