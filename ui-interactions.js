/**
 * UI/UX Interactions Script
 * Handles: lazy-loading, collapsibles, theme switching
 */
document.addEventListener('DOMContentLoaded', () => {

    // Collapsible toggle for culture cards
    const cultureContainer = document.getElementById("culture-list");
    if (cultureContainer) {
        cultureContainer.addEventListener('click', e => {
            const card = e.target.closest('.card-with-image');
            if (card) card.classList.toggle('open');
        });
    }

    // Theme switcher
    const sections = document.querySelectorAll('section[data-theme]');
    const themeObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const theme = entry.target.getAttribute('data-theme');
                document.body.classList.toggle('dark-mode', theme === 'dark');
            }
        });
    }, { threshold: 0.15 });
    sections.forEach(s => themeObserver.observe(s));

    // Lazy loading
    const lazyItems = document.querySelectorAll('.lazy-load');
    const lazyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    lazyItems.forEach(item => lazyObserver.observe(item));

});
