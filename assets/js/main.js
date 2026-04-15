const body = document.body;
const root = body.dataset.root || '';

const header = document.querySelector('.header');
const searchToggle = document.querySelector('.search-toggle');
const searchPanel = document.querySelector('.search-panel');
const searchInput = document.querySelector('.search-input');
const searchResults = document.querySelector('.search-results');
const menuToggle = document.querySelector('.menu-toggle');
const navCenter = document.querySelector('.nav-center');
const backToTopBtn = document.querySelector('.back-to-top');

const articles = window.siteArticles || [];

/* Header shrink */
let isTicking = false;

function updateHeaderOnScroll() {
  if (!header) return;

  const scrollY = window.scrollY;

  if (scrollY > 70) {
    header.classList.add('scrolled');
  } else if (scrollY < 50) {
    header.classList.remove('scrolled');
  }

  isTicking = false;
}

function handleWindowScroll() {
  if (isTicking) return;

  window.requestAnimationFrame(updateHeaderOnScroll);
  isTicking = true;
}

updateHeaderOnScroll();
window.addEventListener('scroll', handleWindowScroll, { passive: true });

/* Active nav */
function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

setActiveNavLink();

/* Search */
function clearSearchResults() {
  if (!searchResults) return;
  searchResults.classList.remove('show');
  searchResults.innerHTML = '';
}

function closeMobileMenu() {
  if (!menuToggle || !navCenter) return;

  navCenter.classList.remove('open');
  menuToggle.classList.remove('active');
  menuToggle.setAttribute('aria-expanded', 'false');
}

function openSearch() {
  if (!searchPanel) return;

  closeMobileMenu();
  searchPanel.classList.add('open');

  if (searchInput) {
    setTimeout(() => searchInput.focus(), 120);
  }
}

function closeSearch() {
  if (!searchPanel) return;

  searchPanel.classList.remove('open');
  clearSearchResults();

  if (searchInput) {
    searchInput.value = '';
  }
}

function renderSearchResults(items) {
  if (!searchResults) return;

  if (items.length === 0) {
    searchResults.innerHTML =
      '<div class="search-empty">Aucun résultat trouvé.</div>';
    searchResults.classList.add('show');
    return;
  }

  searchResults.innerHTML = items
    .map(
      (item) => `
        <a class="search-result-item" href="${root}${item.path}">
          <div class="search-result-category">${item.category}</div>
          <div class="search-result-title">${item.title}</div>
        </a>
      `,
    )
    .join('');

  searchResults.classList.add('show');
}

function handleSearchInput(event) {
  const query = event.target.value.trim().toLowerCase();

  if (!query) {
    clearSearchResults();
    return;
  }

  const filteredArticles = articles.filter((item) => {
    return (
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  renderSearchResults(filteredArticles);
}

if (searchToggle && searchPanel) {
  searchToggle.addEventListener('click', (event) => {
    event.stopPropagation();

    const isOpen = searchPanel.classList.contains('open');
    if (isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('input', handleSearchInput);
}

/* Mobile menu */
function toggleMobileMenu() {
  if (!menuToggle || !navCenter) return;

  const isOpen = navCenter.classList.contains('open');

  closeSearch();

  navCenter.classList.toggle('open');
  menuToggle.classList.toggle('active');
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
}

if (menuToggle && navCenter) {
  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMobileMenu();
  });
}

/* Close events */
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSearch();
    closeMobileMenu();
  }
});

document.addEventListener('click', (event) => {
  const target = event.target;

  if (searchPanel && searchToggle) {
    const clickedInsidePanel = searchPanel.contains(target);
    const clickedSearchToggle = searchToggle.contains(target);

    if (!clickedInsidePanel && !clickedSearchToggle) {
      closeSearch();
    }
  }

  if (menuToggle && navCenter) {
    const clickedMenuToggle = menuToggle.contains(target);
    const clickedInsideNav = navCenter.contains(target);

    if (!clickedMenuToggle && !clickedInsideNav) {
      closeMobileMenu();
    }
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMobileMenu();
  }
});

/* Page transition */
function shouldHandlePageTransition(link, event) {
  const href = link.getAttribute('href');

  if (!href) return false;
  if (href.startsWith('#')) return false;
  if (href.startsWith('mailto:')) return false;
  if (href.startsWith('tel:')) return false;
  if (href.startsWith('javascript:')) return false;
  if (link.hasAttribute('target')) return false;
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return false;
  }

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return false;

  return true;
}

document.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', function (event) {
    if (!shouldHandlePageTransition(this, event)) return;

    const href = this.getAttribute('href');
    event.preventDefault();

    body.classList.add('page-fade-out');

    setTimeout(() => {
      window.location.href = href;
    }, 180);
  });
});

/* Article date */
function setArticleDate() {
  const articleDates = document.querySelectorAll('.article-date');
  if (!articleDates.length) return;

  const now = new Date();
  const formatted = now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isoDate = now.toISOString().split('T')[0];

  articleDates.forEach((el) => {
    el.textContent = formatted;
    el.setAttribute('datetime', isoDate);
  });
}

setArticleDate();

/* Reading progress */
function updateReadingProgress() {
  const progressBar = document.querySelector('.reading-progress-bar');
  if (!progressBar) return;

  const scrollTop = window.scrollY || window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  if (docHeight <= 0) {
    progressBar.style.width = '0%';
    return;
  }

  const progress = (scrollTop / docHeight) * 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  progressBar.style.width = `${clampedProgress}%`;
}

window.addEventListener('scroll', updateReadingProgress, { passive: true });
window.addEventListener('resize', updateReadingProgress);
window.addEventListener('load', updateReadingProgress);
updateReadingProgress();

/* Share buttons */
function setupShareButtons() {
  const whatsappBtn = document.querySelector('.share-whatsapp');
  const facebookBtn = document.querySelector('.share-facebook');
  const copyBtn = document.querySelector('.share-copy');

  const pageUrl = window.location.href;
  const pageTitle = document.title;

  if (whatsappBtn) {
    const whatsappText = `${pageTitle} ${pageUrl}`;
    whatsappBtn.setAttribute(
      'href',
      `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
    );
    whatsappBtn.setAttribute('target', '_blank');
    whatsappBtn.setAttribute('rel', 'noopener noreferrer');
  }

  if (facebookBtn) {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      pageUrl,
    )}`;
    facebookBtn.setAttribute('href', fbUrl);
    facebookBtn.setAttribute('target', '_blank');
    facebookBtn.setAttribute('rel', 'noopener noreferrer');
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pageUrl);
        copyBtn.textContent = 'Lien copié';
        copyBtn.classList.add('copied');

        setTimeout(() => {
          copyBtn.textContent = 'Copier le lien';
          copyBtn.classList.remove('copied');
        }, 1800);
      } catch (error) {
        copyBtn.textContent = 'Impossible';

        setTimeout(() => {
          copyBtn.textContent = 'Copier le lien';
        }, 1800);
      }
    });
  }
}

setupShareButtons();

/* Related articles */
function getCategoryDataCat(category) {
  const normalized = category.trim().toUpperCase();

  if (normalized === 'ACTUALITÉS') return 'ACTUALITÉS';
  if (normalized === 'CULTURE') return 'CULTURE';
  if (normalized === 'DIVERTISSEMENT') return 'DIVERTISSEMENT';

  return normalized;
}

function buildImagePath(imagePath) {
  if (!imagePath) return `${root}assets/images/thumbnails/thumb1.jpg`;
  return imagePath.startsWith('http') ? imagePath : `${root}${imagePath}`;
}

function renderAutoRelatedArticles() {
  const relatedContainer = document.querySelector('#related-articles-list');
  const articlePage = document.querySelector('.article-page');

  if (!relatedContainer || !articlePage) return;

  const currentPath = window.location.pathname.split('/').pop();
  const currentCategoryEl = articlePage.querySelector('.tag');
  const currentCategory = currentCategoryEl
    ? currentCategoryEl.textContent.trim().toUpperCase()
    : '';

  const currentArticleFullPath = `articles/${currentPath}`;

  let related = articles.filter(
    (item) => item.path !== currentArticleFullPath && item.category !== 'PAGE',
  );

  const sameCategory = related.filter(
    (item) => item.category.trim().toUpperCase() === currentCategory,
  );

  const otherCategory = related.filter(
    (item) => item.category.trim().toUpperCase() !== currentCategory,
  );

  related = [...sameCategory, ...otherCategory].slice(0, 3);

  relatedContainer.innerHTML = related
    .map(
      (item) => `
        <article class="related-card">
          <a href="${root}${item.path}">
            <img src="${buildImagePath(item.image)}" alt="${item.title}">
            <p class="tag" data-cat="${getCategoryDataCat(item.category)}">${item.category}</p>
            <h3>${item.title}</h3>
          </a>
        </article>
      `,
    )
    .join('');
}

renderAutoRelatedArticles();

/* Back to top */
function toggleBackToTop() {
  if (!backToTopBtn) return;

  if (window.scrollY > 350) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
}

if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
}
