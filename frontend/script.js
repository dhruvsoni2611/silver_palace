// script.js - Frontend interactions

const SUB_CATEGORIES = {
    "MEN": ["Bracelets", "Rings", "Kadas", "Chains", "Pendants", "Broches"],
    "WOMEN": ["Bracelets", "Rings", "Kadas", "Chains", "Pendants", "Earrings", "Necklaces", "Sets", "Pendant Sets", "Broches"],
    "KIDS": ["Bracelets", "Rings", "Chains", "Anklets", "Pendants"],
    "IDOLS": ["God Idols", "Pooja Items", "Decorative"]
};

const WEIGHT_RANGES = ["5-10 gms", "10-15 gms", "15-25 gms", "25+ gms"];


document.addEventListener('DOMContentLoaded', () => {
  // Navbar Scroll Effect
  const navbar = document.getElementById('mainNavbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Handle initial load based on URL
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') || 'home';
  const category = params.get('category') || 'MEN';
  navigateTo(view, category);

  // ── Featured Carousel: 4 images, rotate every 10s ──
  const totalImages = 20;
  let imagePool = Array.from({length: totalImages}, (_, i) => i + 1);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  let usedSets = [];

  function getNextSet() {
    if (usedSets.length >= Math.floor(totalImages / 4)) usedSets = [];
    shuffle(imagePool);
    const set = imagePool.slice(0, 4);
    usedSets.push(set);
    return set;
  }

  function setCarouselImages(ids) {
    const cards = document.querySelectorAll('.featured-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transition = 'opacity 0.6s ease';
      setTimeout(() => {
        const img = card.querySelector('img');
        img.src = `https://picsum.photos/600/600?random=${ids[i]}`;
        card.style.opacity = '1';
      }, 400);
    });
  }

  const carousel = document.getElementById('featuredCarousel');
  if (carousel) {
    setCarouselImages(getNextSet());
    setInterval(() => setCarouselImages(getNextSet()), 10000);
  }
});


// SPA Navigation
window.navigateTo = function(view, category = 'MEN') {
  const homeView = document.getElementById('home-view');
  const shopView = document.getElementById('shop-view');
  const adminView = document.getElementById('admin-view');
  const cartView = document.getElementById('cart-view');
  const checkoutView = document.getElementById('checkout-view');
  
  // Hide all views first
  homeView.style.display = 'none';
  shopView.style.display = 'none';
  adminView.style.display = 'none';
  cartView.style.display = 'none';
  checkoutView.style.display = 'none';
  
  if (view === 'home') {
    homeView.style.display = 'block';
    window.history.pushState({}, '', '/');
  } else if (view === 'shop') {
    shopView.style.display = 'block';
    window.history.pushState({}, '', '/?view=shop&category=' + category);
    if (typeof renderShopView === 'function') {
      renderShopView(category);
    }
  } else if (view === 'admin') {
    adminView.style.display = 'block';
    window.history.pushState({}, '', '/?view=admin');
    if (typeof renderAdminView === 'function') {
      renderAdminView();
    }
  } else if (view === 'cart') {
    cartView.style.display = 'block';
    window.history.pushState({}, '', '/?view=cart');
    renderCartView();
  } else if (view === 'checkout') {
    checkoutView.style.display = 'block';
    window.history.pushState({}, '', '/?view=checkout');
    renderCheckoutView();
  }

  // Close sidebar if open
  closeSidebarMenu();
};

// Cart Logic
let cart = JSON.parse(localStorage.getItem('silver_palace_cart')) || [];

window.addToCart = function(product) {
    const existing = cart.find(item => item.code_no === product.code_no);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({...product, quantity: 1, rate: 0});
    }
    saveCart();
    updateCartCount();
    
    if (typeof window.updateProductActionUI === 'function') {
        window.updateProductActionUI(product);
    } else {
        alert(`${product.item_name} added to cart!`);
    }
};

window.updateCartItemQuantity = function(product, change) {
    const existingIndex = cart.findIndex(item => item.code_no === product.code_no);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += change;
        if (cart[existingIndex].quantity <= 0) {
            cart.splice(existingIndex, 1);
        }
    }
    saveCart();
    updateCartCount();
    
    if (typeof window.updateProductActionUI === 'function') {
        window.updateProductActionUI(product);
    }
};

window.getCartQuantity = function(code_no) {
    const existing = cart.find(item => item.code_no === code_no);
    return existing ? existing.quantity : 0;
};

window.showCart = function() {
    navigateTo('cart');
};

function saveCart() {
    localStorage.setItem('silver_palace_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').innerText = count;
}

// Initial count update
document.addEventListener('DOMContentLoaded', updateCartCount);


window.handleAdminAccess = function() {
    const pin = prompt("Enter Admin PIN:");
    if (pin === "1234") { // You can change this PIN
        navigateTo('admin');
    } else {
        alert("Incorrect PIN!");
    }
};

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'shop') {
    navigateTo('shop', params.get('category') || 'MEN');
  } else {
    navigateTo('home');
  }
});

function closeSidebarMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sideMenu) sideMenu.classList.remove('active');
  if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  // IntersectionObserver for fade-in animations
  const observerOptions = {
    threshold: 0.1
  };
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const fadeElems = document.querySelectorAll('.hero-content, .gallery h3, .card');
  fadeElems.forEach(el => observer.observe(el));

  // Sidebar logic
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', () => {
      document.getElementById('sideMenu').classList.add('active');
      sidebarOverlay.classList.add('active');
    });
  }

  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebarMenu);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebarMenu);

  // Sidebar Category Dropdown Toggle
  const categoryDropdownBtn = document.getElementById('categoryDropdownBtn');
  const sideCategoryDropdown = document.getElementById('sideCategoryDropdown');

  if (categoryDropdownBtn && sideCategoryDropdown) {
    categoryDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      categoryDropdownBtn.classList.toggle('active');
      sideCategoryDropdown.classList.toggle('active');
    });
  }
});
