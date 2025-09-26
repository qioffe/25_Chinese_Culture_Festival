/**
 * Dynamic Content and Interactions Script
 * Fetches content from an external XML file and handles UI logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    // URL for the external XML content
    const xmlFilePath = 'https://qioffe.github.io/25_Chinese_Culture_Festival/festivalData';

    // --- Utility Functions ---

    /**
     * Toggles the open/closed state of a culture activity card.
     * @param {HTMLElement} card - The card element to toggle.
     */
    const toggleCard = (card) => {
        const isOpen = card.classList.contains('open');
        const content = card.querySelector('.collapsible-content');
        
        if (content) {
            // Apply the height calculation for the transition effect
            if (isOpen) {
                card.classList.remove('open');
                content.style.maxHeight = null;
            } else {
                card.classList.add('open');
                // Set max-height to the scroll height for smooth 'auto' transition
                content.style.maxHeight = content.scrollHeight + 50 + "px";
            }
        }
    };

    /**
     * Safely escapes unencoded ampersands in text, which cause XML parsing errors.
     * @param {string} text - The raw XML text.
     * @returns {string} Sanitized XML text.
     */
    const sanitizeXmlText = (text) => {
        // Replace & that is NOT part of a pre-existing entity (&amp;, &lt;, etc.)
        return text.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#x?\d+;)/g, '&amp;');
    }


    // --- Rendering Functions ---

    /**
     * Renders the Stage Program list items into the DOM.
     * @param {XMLDocument} xmlDoc - The parsed XML document.
     */
    const renderProgramList = (xmlDoc) => {
        const listContainer = document.getElementById('program-list');
        listContainer.innerHTML = ''; // Clear existing content

        // FIX: XML structure is <program><item>...</item></program>, selecting all <item> elements.
        const programs = xmlDoc.querySelectorAll('program item');

        if (programs.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--color-muted);">节目列表加载失败或为空。</p>';
            console.warn('Program list: No <program> elements found in XML.');
            return;
        }

        const fragment = document.createDocumentFragment();

        programs.forEach((program) => {
            // Attributes are read from the <item> tag itself
            const number = program.getAttribute('number') || '';
            const performer = program.getAttribute('performer') || '';
            
            // Sub-elements are read as children of <item>
            const titleZh = program.querySelector('titleZh')?.textContent || '节目名称';
            const titleEn = program.querySelector('titleEn')?.textContent || 'Program Title';
            const bioZh = program.querySelector('bioZh')?.textContent;
            const bioEn = program.querySelector('bioEn')?.textContent;

            const article = document.createElement('article');
            article.className = 'program-item card lazy-load';

            let bioHtml = '';
            if (bioZh || bioEn) {
                bioHtml = `<blockquote class='bio'>
                    ${bioZh ? `<p class="zh-content">${bioZh}</p>` : ''}
                    ${bioEn ? `<p class="en-sub"><strong>Performer Bio:</strong> ${bioEn}</p>` : ''}
                </blockquote>`;
            }

            article.innerHTML = `
                <div class='item-number'>${number}</div>
                <div class="item-details">
                    <h3 class="zh-content">${titleZh}<div class='sub'>${titleEn}</div></h3>
                    <p class='performer'>${performer}</p>
                    ${bioHtml}
                </div>
            `;
            fragment.appendChild(article);
        });

        listContainer.appendChild(fragment);
    };

    /**
     * Renders the Culture Notes list items into the DOM and sets up click listeners.
     * @param {XMLDocument} xmlDoc - The parsed XML document.
     */
    const renderCultureList = (xmlDoc) => {
        const listContainer = document.getElementById('culture-list');
        listContainer.innerHTML = ''; // Clear existing content

        // FIX: The XML uses the PascalCase tag <cultureNotes> for the parent container.
        const items = xmlDoc.querySelectorAll('cultureNotes note'); 

        if (items.length === 0) {
            listContainer.innerHTML = '<li style="text-align: center; width: 100%; color: var(--color-muted); padding: 24px;">文化注释内容加载失败或为空。</li>';
            console.warn('Culture Notes: No <note> elements found in XML with selector "cultureNotes note".');
            return;
        }

        const fragment = document.createDocumentFragment();

        items.forEach((item) => {
            const titleZh = item.querySelector('titleZh')?.textContent || '文化标题';
            const titleEn = item.querySelector('titleEn')?.textContent || 'Culture Title';
            const descZh = item.querySelector('descZh')?.textContent || '中文描述';
            const descEn = item.querySelector('descEn')?.textContent || 'English Description';
            
            // Attributes are read from the <note> tag itself
            const image = item.getAttribute('image') || 'https://placehold.co/600x400/f0f0f0/909090?text=Placeholder';
            const category = item.getAttribute('category') || 'Culture 101';
            
            const tagClass = category.toLowerCase().includes('hands-on') ? 'hands-on' : 'culture-101';

            const listItem = document.createElement('li');

            listItem.innerHTML = `
                <div class="card-with-image lazy-load">
                    <div class="card-header">
                        <div class="card-content">
                            <h3 class="zh-content">${titleZh}<div class="sub">${titleEn}</div></h3>
                        </div>
                        <div class="card-image">
                            <img src="${image}" alt="${titleEn}" loading="lazy">
                        </div>
                    </div>
                    
                    <div class="collapsible-content">
                        <div>
                            <p class="zh-content">${descZh}</p>
                            <p class="sub">${descEn}</p>
                        </div>
                    </div>
                    <div class="tag-container">
                        <button class="tag-btn ${tagClass}">${category}</button>
                    </div>
                </div>
            `;
            
            const cardElement = listItem.querySelector('.card-with-image');
            
            // Attach click listener to the entire card
            cardElement.addEventListener('click', () => {
                toggleCard(cardElement);
            });
            
            fragment.appendChild(listItem);
        });

        listContainer.appendChild(fragment);
    };


    // --- Main Fetch and Init Logic ---

    const fetchAndRenderContent = async () => {
        try {
            const response = await fetch(xmlFilePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawText = await response.text();
            
            // Fix for the XML parsing error: escape bare ampersands
            const sanitizedText = sanitizeXmlText(rawText);

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(sanitizedText, "text/xml");
            
            // Check for XML parsing errors (e.g., if the root tag is not correct)
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                 throw new Error("XML Parsing Error: Check the remote file structure for unclosed tags or invalid characters.");
            }

            renderProgramList(xmlDoc);
            renderCultureList(xmlDoc);

            // Re-initialize lazy loading after dynamic content is added
            initializeObservers();

        } catch (error) {
            console.error('Content loading failed:', error);
            document.getElementById('program-list').innerHTML = '<p style="text-align: center; color: red;">Error: Failed to load program content.</p>';
            document.getElementById('culture-list').innerHTML = '<li style="text-align: center; width: 100%; color: red; padding: 24px;">Error: Failed to load cultural notes.</li>';
        }
    };


    // --- Observers Initialization (Moved from HTML to JS) ---
    const initializeObservers = () => {
        // --- Scroll-triggered Theme Switching (Applied to static sections) ---
        const sections = document.querySelectorAll('section[data-theme]');
        const body = document.body;

        const themeObserverOptions = {
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
        }, themeObserverOptions);

        sections.forEach(section => themeObserver.observe(section));

        // --- Lazy Loading for info cards (Applied after content is rendered) ---
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
    }

    // Start fetching content when the DOM is ready
    fetchAndRenderContent();
});
