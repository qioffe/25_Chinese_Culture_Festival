/**
 * Dynamic Content and Interactions
 * * This script is responsible for:
 * 1. Fetching content from an external XML file (data.xml).
 * 2. Parsing the XML data.
 * 3. Dynamically rendering the Stage Program and Culture Notes sections.
 * 4. Initializing theme switching and lazy loading observers.
 * 5. Managing card interactions (expand/collapse and hover effects).
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // Use the absolute URL provided by the user for the hosted XML data
    const xmlFilePath = 'https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData';

    // --- Utility Functions ---

    /**
     * Renders the Stage Program list items.
     * @param {Element} programElement - The XML element for a single program item.
     * @param {number} index - The index of the program item.
     * @returns {string} HTML string for the program item.
     */
    const renderProgramItem = (programElement, index) => {
        const number = index + 1;
        const titleZh = programElement.querySelector('titleZh')?.textContent || '';
        const titleEn = programElement.querySelector('titleEn')?.textContent || '';
        const performer = programElement.querySelector('performer')?.textContent || '';
        const bioZh = programElement.querySelector('bioZh')?.textContent || '';
        const bioEn = programElement.querySelector('bioEn')?.textContent || '';
        
        let bioHtml = '';
        if (bioZh || bioEn) {
            bioHtml = `
                <blockquote class='bio'>
                    ${bioZh ? `<p class="zh-content">${bioZh}</p>` : ''}
                    ${bioEn ? `<p class="en-sub"><strong>Performer Bio:</strong> ${bioEn}</p>` : ''}
                </blockquote>
            `;
        }

        return `
            <article class='program-item card lazy-load'>
                <div class='item-number'>${number}</div>
                <div class="item-details">
                    <h3 class="zh-content">${titleZh}<div class='sub'>${titleEn}</div></h3>
                    <p class='performer'>${performer}</p>
                    ${bioHtml}
                </div>
            </article>
        `;
    };

    /**
     * Renders the Culture Notes list items.
     * @param {Element} cultureElement - The XML element for a single culture note.
     * @returns {string} HTML string for the culture note item.
     */
    const renderCultureItem = (cultureElement) => {
        const titleZh = cultureElement.querySelector('titleZh')?.textContent || '';
        const titleEn = cultureElement.querySelector('titleEn')?.textContent || '';
        const image = cultureElement.querySelector('image')?.textContent || 'https://placehold.co/600x400/f0f0f0/909090?text=Placeholder';
        const category = cultureElement.querySelector('category')?.textContent || '';
        const descZh = cultureElement.querySelector('descZh')?.textContent || '';
        const descEn = cultureElement.querySelector('descEn')?.textContent || '';
        
        const isHandsOn = category === 'Hands-On';
        const tagClass = isHandsOn ? 'hands-on' : 'culture-101';
        
        // Structure: 
        // 1. Header (Title/Subtitle + Image)
        // 2. Collapsible Content (Description)
        // 3. Tags/Chips (Placed at the very bottom)
        return `
            <li class="lazy-load">
                <div class="card-with-image" data-expanded="false">
                    <div class="card-header">
                        <div class="card-image">
                            <img src="${image}" alt="${titleEn}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/300x300/f0f0f0/909090?text=Image+Error';">
                        </div>
                        <div class="card-content">
                            <h3 class="zh-content">${titleZh}<div class="sub">${titleEn}</div></h3>
                        </div>
                    </div>
                    
                    <div class="collapsible-content">
                        <div>
                            <p class="zh-content">${descZh}</p>
                            <p class="sub">${descEn}</p>
                        </div>
                    </div>

                    <!-- TAGS ARE AT THE VERY BOTTOM -->
                    <div class="tag-container">
                        <button class="tag-btn ${tagClass}">${category}</button>
                    </div>
                </div>
            </li>
        `;
    };

    /**
     * Attaches the click listener to toggle card expansion.
     */
    const setupCardInteractions = () => {
        const cards = document.querySelectorAll('.card-with-image');
        cards.forEach(card => {
            const header = card.querySelector('.card-header');
            if (header) {
                header.addEventListener('click', () => {
                    const isExpanded = card.getAttribute('data-expanded') === 'true';
                    card.setAttribute('data-expanded', !isExpanded);
                    card.classList.toggle('open', !isExpanded);
                });
            }
        });
    };
    
    /**
     * Initializes the Intersection Observer for lazy loading.
     */
    const setupLazyLoading = () => {
        const lazyLoadItems = document.querySelectorAll('.lazy-load');
        
        const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

        lazyLoadItems.forEach(item => {
            lazyLoadObserver.observe(item);
        });
    };
    
    // --- Main Logic ---

    /**
     * Fetches XML content, parses it, and injects it into the DOM.
     */
    const fetchAndRenderContent = async () => {
        const programListContainer = document.getElementById('program-list');
        const cultureListContainer = document.getElementById('culture-list');

        try {
            const response = await fetch(xmlFilePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();

            // Sanitize XML text: replace unescaped ampersands (&) to prevent XML parsing errors
            const safeXmlText = xmlText.replace(/&(?!(?:apos|quot|gt|lt|amp);)/g, '&amp;');

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(safeXmlText, "text/xml");

            if (xmlDoc.querySelector('parsererror')) {
                console.error("XML Parsing Error:", xmlDoc.querySelector('parsererror').textContent);
                programListContainer.innerHTML = `<p style="text-align: center; color: red;">Error loading content: XML data is malformed.</p>`;
                cultureListContainer.innerHTML = `<p style="text-align: center; color: red;">Error loading content: XML data is malformed.</p>`;
                return;
            }

            // 1. Render Stage Program
            const programs = xmlDoc.querySelectorAll('program > item');
            let programHtml = '';
            programs.forEach((item, index) => {
                programHtml += renderProgramItem(item, index);
            });
            programListContainer.innerHTML = programHtml;

            // 2. Render Culture Notes
            const cultureNotes = xmlDoc.querySelectorAll('culture > item');
            let cultureHtml = '';
            cultureNotes.forEach(item => {
                cultureHtml += renderCultureItem(item);
            });
            cultureListContainer.innerHTML = cultureHtml;

            // 3. Setup Interactions after content is loaded
            setupCardInteractions();
            setupLazyLoading();

        } catch (error) {
            console.error('Content loading failed:', error);
            programListContainer.innerHTML = `<p style="text-align: center; color: red;">Failed to load program list. Please check the network connection.</p>`;
            cultureListContainer.innerHTML = `<p style="text-align: center; color: red;">Failed to load culture notes. Please check the network connection.</p>`;
        }
    };
    
    // --- Scroll-triggered Theme Switching (Applied to static sections) ---
    const sections = document.querySelectorAll('section[data-theme]');
    const body = document.body;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 
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

    // Start fetching content
    fetchAndRenderContent();
});
