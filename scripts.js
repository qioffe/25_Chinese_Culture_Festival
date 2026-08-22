const URL_2026 = 'https://raw.githubusercontent.com/qioffe/Chinese_Culture_Festival/main/26_festivalData.xml';
const URL_2025_ARCHIVE = 'https://raw.githubusercontent.com/qioffe/Chinese_Culture_Festival/main/25_festivalData.xml';

let currentMode = 'upcoming';

/**
 * Fetch and render the XML repertoire stream
 */
async function fetchAndRenderXML(xmlUrl) {
  const container = document.getElementById('xml-roster-container');
  const response = await fetch(xmlUrl, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const xmlText = await response.text();
  const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (xmlDoc.querySelector('parsererror')) throw new Error('XML parse error');

  const items = xmlDoc.querySelectorAll('item');
  if (items.length === 0) throw new Error('No items in dataset');

  container.innerHTML = '';

  items.forEach((item) => {
    const performer = item.getAttribute('performer') || '';
    const rawTime = item.getAttribute('time') || '';
    const duration = item.getAttribute('duration') || '';

    let formattedTimeHtml = '';
    if (rawTime) {
      const timeParts = rawTime.trim().split(/\s+/);
      const digits = timeParts[0] || '';
      const meridian = timeParts[1] ? timeParts[1].toUpperCase() : '';
      
      formattedTimeHtml = `
        <span class="font-didot font-bold text-sm sm:text-base text-inkJade tracking-tight">${digits}</span>
        ${meridian ? `<span class="font-sans font-bold text-[9px] text-inkGold uppercase">${meridian}</span>` : ''}
      `;
    }

    const getTag = (tagName, langPrefix) => {
      const nodes = Array.from(item.getElementsByTagName(tagName));
      for (let node of nodes) {
        const langAttr = node.getAttribute('xml:lang') || node.getAttribute('lang') || '';
        if (langAttr.toLowerCase().startsWith(langPrefix.toLowerCase())) return node.textContent.trim();
      }
      return '';
    };

    const titleZh = getTag('title', 'zh');
    const titleEn = getTag('title', 'en');
    const genreZh = getTag('genre', 'zh');
    const genreEn = getTag('genre', 'en');
    const bioZh = getTag('bio', 'zh');
    const bioEn = getTag('bio', 'en');

    const rowHTML = `
      <article class="py-3.5 first:pt-0 flex items-start gap-3 min-w-0">
        
        <!-- Track 1: Chrono Stamp with Bodoni Digits -->
        <div class="flex items-baseline gap-1 shrink-0 pt-0.5 w-20 sm:w-24 select-none whitespace-nowrap">
          ${formattedTimeHtml}
          ${duration ? `<span class="font-sans font-medium text-[9.5px] text-inkJade/45 uppercase ml-auto pr-1">(${duration})</span>` : ''}
        </div>

        <!-- Track 2: Cultural Totem -->
        ${genreZh ? `
          <div class="font-serifSc font-bold text-[11.5px] text-inkGold vertical-totem shrink-0 pt-1">
            ${genreZh}
          </div>
        ` : ''}

        <!-- Track 3: Narrative & Performer Payload (Plus Jakarta Sans) -->
        <div class="flex flex-col min-w-0 flex-1 gap-0.5 pl-1 font-sans">
          <div class="flex flex-wrap items-baseline gap-x-2">
            ${titleEn ? `<h4 class="font-didot font-bold text-sm sm:text-base text-inkJade tracking-tight">${titleEn}</h4>` : ''}
            ${titleZh ? `<span class="font-serifSc font-medium text-xs text-inkJade/75">${titleZh}</span>` : ''}
            ${genreEn ? `<span class="font-code text-[9.5px] text-inkGold font-bold uppercase tracking-wider">/ ${genreEn}</span>` : ''}
          </div>

          ${performer ? `
            <div class="text-xs text-inkJade/90 font-medium leading-snug">
              ${performer}
            </div>
          ` : ''}

          ${(bioZh || bioEn) ? `
            <div class="pt-0.5 flex flex-col gap-0.5 text-xs text-inkJade/70 font-normal leading-relaxed">
              ${bioEn ? `<p class="italic text-[11px]">${bioEn}</p>` : ''}
              ${bioZh ? `<p class="font-serifSc text-[11px] text-inkJade/80">${bioZh}</p>` : ''}
            </div>
          ` : ''}
        </div>

      </article>
    `;

    container.insertAdjacentHTML('beforeend', rowHTML);
  });

  return items.length;
}

/**
 * Toggle between the 2026 preview and the 2025 archive
 */
async function setSeasonState(mode) {
  currentMode = mode;
  const cover = document.getElementById('upcoming-cover');
  const rosterWrapper = document.getElementById('roster-wrapper');
  const topToggleBtn = document.getElementById('top-nav-toggle-btn');
  const highlightBanner = document.getElementById('archive-highlight-banner');
  const sideArchiveBadge = document.getElementById('side-archive-badge');

  if (mode === 'archive') {
    // Ensure XML is loaded if not already rendered
    const container = document.getElementById('xml-roster-container');
    if (!container.querySelector('article')) {
      try {
        await fetchAndRenderXML(URL_2025_ARCHIVE);
      } catch (e) {
        console.error("Archive loading error:", e);
      }
    }

    if (rosterWrapper) {
      rosterWrapper.classList.remove('overflow-hidden');
    }
    if (cover) {
      cover.classList.add('hidden');
    }

    if (highlightBanner) highlightBanner.classList.remove('hidden');
    if (sideArchiveBadge) sideArchiveBadge.classList.remove('hidden');
    if (topToggleBtn) topToggleBtn.innerText = '← Return to 2026 Preview';

    const subhead = document.getElementById('side-subhead');
    const mainTitle = document.getElementById('side-main-title');
    if (subhead) subhead.innerText = '2025 ARCHIVE';
    if (mainTitle) mainTitle.innerText = 'Past Repertoire';
  } else {
    if (rosterWrapper) {
      rosterWrapper.classList.add('overflow-hidden');
    }
    if (cover) {
      cover.classList.remove('hidden');
    }

    if (highlightBanner) highlightBanner.classList.add('hidden');
    if (sideArchiveBadge) sideArchiveBadge.classList.add('hidden');
    if (topToggleBtn) topToggleBtn.innerText = 'View 2025 Repertoire';

    const subhead = document.getElementById('side-subhead');
    const mainTitle = document.getElementById('side-main-title');
    if (subhead) subhead.innerText = 'HOUSE PROGRAMME';
    if (mainTitle) mainTitle.innerText = 'Order of Performance';
  }
}

function toggleSeasonView() {
  if (currentMode === 'upcoming') {
    setSeasonState('archive');
  } else {
    setSeasonState('upcoming');
  }
}

/**
 * Web Share API handler
 */
async function shareProgrammeSection() {
  const shareData = {
    title: 'Miami Chinese Culture Festival — House Programme',
    text: 'View the official stage flow and performance repertoire for the Chinese Culture Festival:',
    url: window.location.origin + window.location.pathname + '#programme'
  };

  const shareBtn = document.getElementById('share-section-btn');
  const originalText = shareBtn ? shareBtn.innerText : '↗ Share';

  if (navigator.share) {
    try { 
      await navigator.share(shareData); 
    } catch (err) {
      // User cancelled
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareData.url);
      if (shareBtn) {
        shareBtn.innerText = '✓ Link Copied';
        setTimeout(() => { shareBtn.innerText = originalText; }, 2000);
      }
    } catch (clipErr) {
      // Fallback
    }
  }
}

/**
 * Initial load lifecycle
 */
document.addEventListener("DOMContentLoaded", async () => {
  const cover = document.getElementById('upcoming-cover');
  const topToggleBtn = document.getElementById('top-nav-toggle-btn');
  const rosterWrapper = document.getElementById('roster-wrapper');

  try {
    const count = await fetchAndRenderXML(URL_2026);
    if (cover) cover.remove();
    if (rosterWrapper) rosterWrapper.classList.remove('overflow-hidden');
    if (topToggleBtn) topToggleBtn.classList.add('hidden');
  } catch (err) {
    // 2026 data unavailable -> Pre-fetch 2025 archive in background so preview button works immediately
    try {
      await fetchAndRenderXML(URL_2025_ARCHIVE);
    } catch (archiveErr) {
      console.warn("Programme offline");
    }
  }
});

/**
 * Subconscious Moon Parallax Scroll
 */
const moonLayer = document.getElementById('moon-scroll-layer');
const haloLayer = document.getElementById('halo-scroll-layer');
let ticking = false;

function onScroll() {
  const scrollY = window.scrollY || window.pageYOffset;
  const translateY = -30 - (scrollY * 0.12);
  const scale = 1.0 + (scrollY * 0.0003);

  if (moonLayer) moonLayer.setAttribute('transform', `translate(0, ${translateY}) scale(${scale})`);
  if (haloLayer) haloLayer.setAttribute('transform', `translate(0, ${translateY * 0.9}) scale(${scale})`);
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });
