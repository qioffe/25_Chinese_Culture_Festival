const xmlFilePath = 'https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData'; 

/**
 * Safely gets the text content of a tag within an XML element.
 * @param {Element} xmlElement The parent XML element.
 * @param {string} tagName The name of the tag to extract content from.
 * @returns {string} The text content, or an empty string if not found.
 */
function getText(xmlElement, tagName) {
  const element = xmlElement.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : '';
}

/**
 * Handles fetching and parsing the XML file.
 */
async function fetchAndRenderContent() {
  try {
    const response = await fetch(xmlFilePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.statusText}`);
    }
    const text = await response.text();
    
    // Fix: Sanitize XML content for unescaped ampersands to fix parsing error
    const sanitizedText = text.replace(/&(?!(?:apos|quot|[lg]t|amp);|#)/g, '&amp;');
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sanitizedText, "application/xml");
    
    if (xmlDoc.getElementsByTagName('parsererror').length) {
        console.error("XML Parsing Error (after sanitization):", xmlDoc.getElementsByTagName('parsererror')[0].textContent);
        document.getElementById('program-list').innerHTML = `<p style="text-align: center; color: red;">Error: Failed to parse content data. The remote file structure is invalid.</p>`;
        document.getElementById('culture-list').innerHTML = `<p style="text-align: center; color: red;">Error: Failed to parse content data. The remote file structure is invalid.</p>`;
        return;
    }

    renderProgramList(xmlDoc);
    renderCultureNotes(xmlDoc);
    
    // Re-attach interaction listeners after content is rendered
    attachInteractionListeners();
    
  } catch (error) {
    console.error("Content loading failed:", error);
    document.getElementById('program-list').innerHTML = `<p style="text-align: center; color: red;">Error loading data from ${xmlFilePath}. Check console for details.</p>`;
    document.getElementById('culture-list').innerHTML = `<p style="text-align: center; color: red;">Error loading data from ${xmlFilePath}. Check console for details.</p>`;
  }
}

/**
 * Renders the Stage Program list from XML data.
 * @param {XMLDocument} xmlDoc 
 */
function renderProgramList(xmlDoc) {
  const container = document.getElementById('program-list');
  container.innerHTML = ''; // Clear loading message
  const programItems = xmlDoc.getElementsByTagName('program')[0].getElementsByTagName('item');

  Array.from(programItems).forEach(item => {
    const number = item.getAttribute('number');
    const performer = item.getAttribute('performer');
    const titleZh = getText(item, 'titleZh');
    const titleEn = getText(item, 'titleEn');
    const bioZh = getText(item, 'bioZh');
    const bioEn = getText(item, 'bioEn');

    let bioHtml = '';
    if (bioZh || bioEn) {
      bioHtml = `<blockquote class='bio'>
        ${bioZh ? `<p class="zh-content">${bioZh}</p>` : ''}
        ${bioEn ? `<p class="en-sub"><strong>Performer Bio:</strong> ${bioEn}</p>` : ''}
      </blockquote>`;
    }

    const article = document.createElement('article');
    article.className = 'program-item card lazy-load';
    article.innerHTML = `
      <div class='item-number'>${number}</div>
      <div class="item-details">
        <h3 class="zh-content">${titleZh}<div class='sub'>${titleEn}</div></h3>
        <p class='performer'>${performer}</p>
        ${bioHtml}
      </div>
    `;
    container.appendChild(article);
  });
}

/**
 * Renders the Culture Notes section from XML data.
 * @param {XMLDocument} xmlDoc 
 */
function renderCultureNotes(xmlDoc) {
  const container = document.getElementById('culture-list');
  container.innerHTML = ''; // Clear loading message
  const cultureNotes = xmlDoc.getElementsByTagName('cultureNotes')[0].getElementsByTagName('note');

  Array.from(cultureNotes).forEach(note => {
    const category = note.getAttribute('category');
    const image = note.getAttribute('image');
    const titleZh = getText(note, 'titleZh');
    const titleEn = getText(note, 'titleEn');
    const descZh = getText(note, 'descZh');
    const descEn = getText(note, 'descEn');
    
    const tagClass = category === 'Hands-On' ? 'hands-on' : 'culture-101';

    const li = document.createElement('li');
    const article = document.createElement('article');
    article.className = 'card-with-image lazy-load';
    article.innerHTML = `
      <div class="card-header">
          <div class="card-image">
              <img src="${image}" alt="${titleEn}" loading="lazy">
          </div>
          <div class="card-content">
              <h3 class="zh-content">${titleZh}<div class="sub">${titleEn}</div></h3>
          </div>
      </div>
      <div class="tag-container">
          <button class="tag-btn ${tagClass}">${category}</button>
      </div>
      <div class="collapsible-content">
          <div>
              <p class="zh-content">${descZh}</p>
              <p class="sub">${descEn}</p>
          </div>
      </div>
    `;
    li.appendChild(article);
    container.appendChild(li);
  });
}

/**
 * Attaches click listeners for card collapsing AND initializes dynamic observers.
 * This is called AFTER content is loaded to ensure all .lazy-load elements exist.
 */
function attachInteractionListeners() {
  
  // --- Lazy Loading for info cards (Executed after dynamic content creation) ---
  const lazyLoadItems = document.querySelectorAll('.lazy-load');
  
  const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
          }
      });
  }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }); // Preserving user's threshold and rootMargin

  lazyLoadItems.forEach(item => {
      lazyLoadObserver.observe(item);
  });
  
  // --- Card expand/collapse logic (Re-applied after injection) ---
  const cultureCards = document.querySelectorAll('.card-with-image');
  cultureCards.forEach(card => {
    // Find the card header within the dynamically created article
    const cardHeader = card.querySelector('.card-header');
    if (cardHeader) {
      cardHeader.addEventListener('click', (event) => {
        card.classList.toggle('open');
      });
    }
  });
}

// --- Scroll-triggered Theme Switching (Applied to static sections) ---
const sections = document.querySelectorAll('section[data-theme]');
const body = document.body;

const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.15 // Using user's requested threshold
};

const themeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const theme = entry.target.getAttribute('data-theme');
      if (theme === 'dark') {
        body.classList.add('dark-mode');
      } else {
        body.classList.remove('dark-mode');
      }
    }
  });
}, observerOptions);

sections.forEach(section => themeObserver.observe(section));

// Start the dynamic loading process once the DOM is ready
document.addEventListener('DOMContentLoaded', fetchAndRenderContent);
