/**
 * NutriPlan - Main Entry Point
 * 
 * This is the main entry point for the application.
 * Import your modules and initialize the app here.
 */

import {
  getLoadingSpinner,
  getEmptyState,
  createRecipeCard,
  createCategoryCard,
  createAreaChip,
  createProductCard,
  createFoodLogItem,
  createWeeklyOverviewGrid,
  createIngredientsList,
  createInstructionsList,
  createLogMealModalHTML,
  createProductDetailModalHTML,
  CATEGORY_CONFIG
} from './ui/components.js';

// API Endpoints
const API_BASE = 'https://nutriplan-api.vercel.app/api';
const API_KEY = 'xRGnhxcXrKuX8hJpeeQE5Rac9b7dyQDpaMs5fWFL';
const STORAGE_KEY = 'nutriplan_food_log';
const TARGETS = { calories: 2000, protein: 50, carbs: 250, fat: 65 };

const state = {
  allMeals: [],
  currentRecipes: [],
  categories: [],
  areas: [],
  currentMeal: null,
  currentNutrition: null,
  isGridView: true,

  // Product scanner state
  hasSearched: false,
  lastQuery: '',
  searchedProducts: [],
  currentProducts: [],
  activeCategory: null,
  activeNutriGrade: ''
};

// 2. HELPER FUNCTIONS (API, Date, Alerts)

async function fetchJSON(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Fetch error:', err.message);
    return null;
  }
}

function getTodayDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTodayDate() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());
}

function showNotification(msg, type = 'info') {
  const oldToast = document.querySelector('.toast-notification');
  if (oldToast) oldToast.remove();

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500'
  };

  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 ${colors[type] || 'bg-blue-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50 toast-notification`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showSuccessAlert(title, text, calories) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title,
      html: `<p class="text-gray-600 text-sm">${text}</p>${calories ? `<p class="text-emerald-600 font-bold text-lg mt-2">+${calories} calories</p>` : ''}`,
      icon: 'success',
      confirmButtonColor: '#10b981',
      timer: 2000,
      showConfirmButton: false,
      customClass: { popup: 'rounded-3xl shadow-2xl', title: 'text-2xl font-bold text-gray-900' }
    });
  } else {
    showNotification(`${title}: ${text}`, 'success');
  }
}

function hideLoadingOverlay() {
  const overlay = document.querySelector('#app-loading-overlay');
  if (!overlay) return;
  overlay.style.transition = 'opacity 0.5s ease-out';
  overlay.style.opacity = '0';
  setTimeout(() => overlay.remove(), 500);
}

// 3. NAVIGATION & ROUTING

function showPage(page) {
  const mealsSections = [
    document.querySelector('#search-filters-section'),
    document.querySelector('#meal-categories-section'),
    document.querySelector('#all-recipes-section')
  ];
  const mealDetailsSec = document.querySelector('#meal-details');
  const productsSec = document.querySelector('#products-section');
  const foodLogSec = document.querySelector('#foodlog-section');

  // Hide all sections first
  mealsSections.forEach(sec => { if (sec) sec.style.display = 'none'; });
  if (mealDetailsSec) mealDetailsSec.style.display = 'none';
  if (productsSec) productsSec.style.display = 'none';
  if (foodLogSec) foodLogSec.style.display = 'none';

  // Update active sidebar link
  const pageNames = ['meals', 'products', 'foodlog'];
  document.querySelectorAll('.nav-link').forEach((link, idx) => {
    const isActive = (pageNames[idx] === page) || (page === 'meal-detail' && idx === 0);
    link.className = isActive
      ? 'nav-link flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold transition-all'
      : 'nav-link flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all';
  });

  // Update header text
  const headers = {
    meals: ['Meals & Recipes', 'Discover delicious and nutritious recipes tailored for you'],
    'meal-detail': ['Recipe Details', 'View full recipe information and nutrition facts'],
    products: ['Product Scanner', 'Search packaged foods by name or barcode'],
    foodlog: ['Food Log', 'Track your daily nutrition and food intake']
  };

  const titleEl = document.querySelector('header h1');
  const descEl = document.querySelector('header p');
  if (headers[page] && titleEl && descEl) {
    titleEl.textContent = headers[page][0];
    descEl.textContent = headers[page][1];
  }

  // Display the selected page
  if (page === 'meals') {
    mealsSections.forEach(sec => { if (sec) sec.style.display = ''; });
  } else if (page === 'meal-detail') {
    if (mealDetailsSec) mealDetailsSec.style.display = '';
  } else if (page === 'products') {
    if (productsSec) productsSec.style.display = '';
    if (!state.hasSearched) resetProductScanner();
  } else if (page === 'foodlog') {
    if (foodLogSec) foodLogSec.style.display = '';
    renderFoodLogPage();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRoute() {
  const hash = window.location.hash.slice(1);
  if (hash === 'products') {
    showPage('products');
  } else if (hash === 'foodlog') {
    showPage('foodlog');
  } else if (hash.startsWith('meal/')) {
    openMealDetail(hash.split('/')[1]);
  } else {
    showPage('meals');
  }
}

function navigate(route) {
  window.location.hash = route;
}

// 4. MEALS & RECIPES

function renderAreaChips(areas, activeArea = 'All') {
  const container = document.querySelector('#search-filters-section .flex');
  if (!container) return;

  container.innerHTML = ['All Cuisines', ...areas].map(area => {
    const isAll = area === 'All Cuisines';
    const isActive = (activeArea === 'All' && isAll) || (activeArea === area);
    return createAreaChip(area, isActive);
  }).join('');

  container.querySelectorAll('.area-filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const area = btn.dataset.area;
      renderAreaChips(state.areas, area);

      const grid = document.querySelector('#recipes-grid');
      if (grid) grid.innerHTML = getLoadingSpinner();

      if (area === 'All') {
        state.currentRecipes = state.allMeals;
      } else {
        const data = await fetchJSON(`${API_BASE}/meals/filter?area=${encodeURIComponent(area)}&page=1&limit=25`);
        state.currentRecipes = data?.results || [];
      }
      renderRecipes(state.currentRecipes);
    });
  });
}

function renderCategories(categories) {
  const grid = document.querySelector('#categories-grid');
  if (!grid) return;

  const allowedNames = Object.keys(CATEGORY_CONFIG);
  const list = categories.filter(c => allowedNames.includes(c.name || c.strCategory)).slice(0, 12);
  grid.innerHTML = list.map(createCategoryCard).join('');

  grid.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', async () => {
      const cat = card.dataset.category;
      const rGrid = document.querySelector('#recipes-grid');
      if (rGrid) rGrid.innerHTML = getLoadingSpinner();

      const data = await fetchJSON(`${API_BASE}/meals/filter?category=${encodeURIComponent(cat)}&page=1&limit=25`);
      state.currentRecipes = data?.results || [];
      renderRecipes(state.currentRecipes);
      document.querySelector('#all-recipes-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderRecipes(recipes) {
  const grid = document.querySelector('#recipes-grid');
  const countEl = document.querySelector('#recipes-count');
  if (!grid) return;

  if (countEl) countEl.textContent = `Showing ${recipes.length} recipes`;

  if (!recipes || recipes.length === 0) {
    grid.className = 'grid grid-cols-1 gap-5';
    grid.innerHTML = getEmptyState('No recipes found', 'Try searching for something else');
    return;
  }

  grid.className = state.isGridView
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'
    : 'grid grid-cols-1 md:grid-cols-2 gap-5';
  grid.innerHTML = recipes.map(m => createRecipeCard(m, state.isGridView)).join('');
}

async function handleMealSearch(query) {
  const clean = query.trim();
  if (!clean) {
    state.currentRecipes = state.allMeals;
    renderRecipes(state.currentRecipes);
    return;
  }

  const grid = document.querySelector('#recipes-grid');
  if (grid) grid.innerHTML = getLoadingSpinner();

  const data = await fetchJSON(`${API_BASE}/meals/search?q=${encodeURIComponent(clean)}&page=1&limit=25`);
  const pool = (data?.results && data.results.length > 0) ? data.results : state.allMeals;

  // Simple search matching name, category, or area
  const term = clean.toLowerCase();
  state.currentRecipes = pool.filter(m => {
    const name = (m.name || m.strMeal || '').toLowerCase();
    const cat = (m.category || m.strCategory || '').toLowerCase();
    const area = (m.area || m.strArea || '').toLowerCase();
    return name.includes(term) || cat.includes(term) || area.includes(term);
  });

  renderRecipes(state.currentRecipes);
}

async function openMealDetail(id) {
  showPage('meal-detail');

  const data = await fetchJSON(`${API_BASE}/meals/${id}`);
  const meal = data?.result;
  if (!meal) return;
  state.currentMeal = meal;

  // Set image, title, and badges
  const imgEl = document.querySelector('#meal-detail-img');
  if (imgEl) {
    imgEl.src = meal.thumbnail || meal.strMealThumb;
    imgEl.alt = meal.name || meal.strMeal;
  }

  const titleEl = document.querySelector('#meal-detail-title');
  if (titleEl) titleEl.textContent = meal.name || meal.strMeal;

  const badges = document.querySelector('#meal-detail-badges');
  if (badges) {
    badges.innerHTML = `
      <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${meal.category || 'Recipe'}</span>
      <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${meal.area || 'International'}</span>
    `;
  }

  // Set hero text & loading state
  const heroServings = document.querySelector('#hero-servings');
  const heroCalories = document.querySelector('#hero-calories');
  const logBtn = document.querySelector('#log-meal-btn');
  const nutLoading = document.querySelector('#nutrition-loading');
  const nutContent = document.querySelector('#nutrition-facts-content');

  if (heroServings) heroServings.textContent = `${meal.servings || 4} servings`;
  if (heroCalories) heroCalories.innerHTML = '<i class="fa-solid fa-fire mr-1"></i><span>Calculating...</span>';

  if (logBtn) {
    logBtn.disabled = true;
    logBtn.className = 'flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold transition-all cursor-not-allowed';
    logBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i><span>Calculating...</span>';
  }

  if (nutLoading) nutLoading.classList.remove('hidden');
  if (nutContent) nutContent.classList.add('hidden');

  // Ingredients and instructions list
  const ingredients = meal.ingredients || [];
  const ingCount = document.querySelector('#meal-detail-ing-count');
  if (ingCount) ingCount.textContent = `${ingredients.length} items`;

  const ingGrid = document.querySelector('#meal-ingredients-list');
  if (ingGrid) ingGrid.innerHTML = createIngredientsList(ingredients);

  const stepsContainer = document.querySelector('#meal-instructions-list');
  if (stepsContainer) stepsContainer.innerHTML = createInstructionsList(meal.instructions);

  // Video embed
  const videoCard = document.querySelector('#meal-video-card');
  const iframe = document.querySelector('#meal-detail-video');
  if (iframe) {
    const match = (meal.youtube || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) {
      iframe.src = `https://www.youtube.com/embed/${match[1]}`;
      if (videoCard) videoCard.style.display = 'block';
    } else {
      iframe.src = 'about:blank';
      if (videoCard) videoCard.style.display = 'none';
    }
  }

  // Fetch Nutrition Analysis
  const ingStrings = ingredients.map(i => `${i.measure || ''} ${i.ingredient}`.trim());
  const nutData = await fetchJSON(`${API_BASE}/nutrition/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ recipeName: meal.name, ingredients: ingStrings })
  });

  state.currentNutrition = nutData?.data || null;
  const perServing = state.currentNutrition?.perServing || {
    calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, saturatedFat: 0, cholesterol: 0, sodium: 0
  };
  const totals = state.currentNutrition?.totals || { calories: perServing.calories * 4 };

  if (heroCalories) heroCalories.textContent = `${perServing.calories} cal/serving`;

  if (logBtn) {
    logBtn.disabled = false;
    logBtn.className = 'flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all cursor-pointer';
    logBtn.innerHTML = '<i class="fa-solid fa-clipboard-list"></i><span>Log This Meal</span>';
  }

  // Populate nutrition facts values into static HTML
  if (nutLoading) nutLoading.classList.add('hidden');
  if (nutContent) {
    nutContent.classList.remove('hidden');

    const setText = (selector, val) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = val;
    };
    const setBar = (selector, val, target) => {
      const el = document.querySelector(selector);
      if (el) el.style.width = `${Math.min(100, Math.round((val / target) * 100))}%`;
    };

    setText('#nut-cal-val', perServing.calories || 0);
    setText('#nut-total-cal-val', totals.calories || (perServing.calories || 0) * 4);

    setText('#nut-protein-val', `${perServing.protein || 0}g`);
    setBar('#nut-protein-bar', perServing.protein || 0, 50);

    setText('#nut-carbs-val', `${perServing.carbs || 0}g`);
    setBar('#nut-carbs-bar', perServing.carbs || 0, 250);

    setText('#nut-fat-val', `${perServing.fat || 0}g`);
    setBar('#nut-fat-bar', perServing.fat || 0, 65);

    setText('#nut-fiber-val', `${perServing.fiber || 0}g`);
    setBar('#nut-fiber-bar', perServing.fiber || 0, 28);

    setText('#nut-sugar-val', `${perServing.sugar || 0}g`);
    setBar('#nut-sugar-bar', perServing.sugar || 0, 50);

    setText('#nut-satfat-val', `${perServing.saturatedFat || 0}g`);
    setBar('#nut-satfat-bar', perServing.saturatedFat || 0, 20);

    setText('#nut-cholesterol-val', `${perServing.cholesterol || 0}mg`);
    setText('#nut-sodium-val', `${perServing.sodium || 0}mg`);
  }
}

function showLogMealModal(meal) {
  let servings = 1;
  const perServing = state.currentNutrition?.perServing || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = createLogMealModalHTML(meal, perServing, servings);
  document.body.appendChild(modal);

  const updateModalValues = () => {
    modal.querySelector('#modal-calories').textContent = Math.round(perServing.calories * servings);
    modal.querySelector('#modal-protein').textContent = `${Math.round(perServing.protein * servings)}g`;
    modal.querySelector('#modal-carbs').textContent = `${Math.round(perServing.carbs * servings)}g`;
    modal.querySelector('#modal-fat').textContent = `${Math.round(perServing.fat * servings)}g`;
    modal.querySelector('#meal-servings').value = servings;
  };

  modal.querySelector('#decrease-servings').onclick = () => {
    if (servings > 0.5) {
      servings -= 0.5;
      updateModalValues();
    }
  };

  modal.querySelector('#increase-servings').onclick = () => {
    if (servings < 10) {
      servings += 0.5;
      updateModalValues();
    }
  };

  modal.querySelector('#cancel-log-meal').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  modal.querySelector('#confirm-log-meal').onclick = () => {
    const calories = Math.round(perServing.calories * servings);
    addLog({
      name: meal.name || meal.strMeal,
      calories,
      protein: Math.round(perServing.protein * servings),
      carbs: Math.round(perServing.carbs * servings),
      fat: Math.round(perServing.fat * servings),
      image: meal.thumbnail || meal.strMealThumb,
      servings,
      type: 'meal'
    });
    modal.remove();
    showSuccessAlert('Meal Logged!', `${meal.name || meal.strMeal} (${servings} serving) has been added to your daily log.`, calories);
  };
}

// 5. PRODUCT SCANNER
function normalizeProduct(p) {
  if (!p) return null;
  const n = p.nutrients || p.nutrition || p.nutriments || {};
  return {
    barcode: String(p.barcode || p.code || p._id || Date.now()),
    name: p.name || p.product_name || p.product_name_en || 'Product Name',
    brand: p.brand || p.brands || 'Unknown Brand',
    image: p.image || p.image_url || p.image_front_url || p.image_small_url || '',
    category: p.category || p.categories || '',
    quantity: p.quantity || p.product_quantity || '',
    ingredients: p.ingredients || p.ingredients_text || p.ingredients_text_en || '',
    allergens: p.allergens || (Array.isArray(p.allergens_tags) ? p.allergens_tags.join(', ') : '') || p.allergens_from_ingredients || '',
    nutritionGrade: (p.nutritionGrade || p.nutriscore_grade || '').toLowerCase(),
    novaGroup: p.novaGroup || p.nova_group || null,
    nutrients: {
      calories: Math.round(n.calories || n['energy-kcal_100g'] || n['energy-kcal'] || 0),
      protein: parseFloat(n.protein || n.proteins_100g || n.proteins || 0).toFixed(1),
      carbs: parseFloat(n.carbs || n.carbohydrates_100g || n.carbohydrates || 0).toFixed(1),
      fat: parseFloat(n.fat || n.fat_100g || 0).toFixed(1),
      sugar: parseFloat(n.sugar || n.sugars_100g || n.sugars || 0).toFixed(1),
      saturatedFat: parseFloat(n.saturatedFat || n['saturated-fat_100g'] || 0).toFixed(1),
      fiber: parseFloat(n.fiber || n.fiber_100g || 0).toFixed(1),
      salt: parseFloat(n.salt || n.salt_100g || n.sodium || 0).toFixed(2)
    }
  };
}

function resetProductScanner() {
  state.hasSearched = false;
  state.lastQuery = '';
  state.searchedProducts = [];
  state.currentProducts = [];
  state.activeCategory = null;
  state.activeNutriGrade = '';

  const grid = document.querySelector('#products-grid');
  const loading = document.querySelector('#products-loading');
  const empty = document.querySelector('#products-empty');
  const countEl = document.querySelector('#products-count');

  if (grid) grid.innerHTML = '';
  if (loading) loading.classList.add('hidden');
  if (empty) empty.classList.remove('hidden');
  if (countEl) countEl.textContent = 'Search for products to see results';

  document.querySelectorAll('.product-category-btn').forEach(btn => {
    btn.style.opacity = '1';
    btn.style.transform = '';
    btn.style.boxShadow = '';
  });
}

function renderProducts(products, countText) {
  const loading = document.querySelector('#products-loading');
  const empty = document.querySelector('#products-empty');
  const countEl = document.querySelector('#products-count');
  const grid = document.querySelector('#products-grid');

  if (loading) loading.classList.add('hidden');
  if (countEl && countText !== undefined) countEl.textContent = countText;

  if (!products || products.length === 0) {
    if (empty) empty.classList.remove('hidden');
    if (grid) grid.innerHTML = '';
    return;
  }

  if (empty) empty.classList.add('hidden');
  if (grid) grid.innerHTML = products.map(createProductCard).join('');
}

// Simple keywords for product categories
const CATEGORY_KEYWORDS = {
  'breakfast-cereals': ['cereal', 'breakfast', 'oat', 'granola', 'muesli', 'flake', 'porridge'],
  'beverages': ['beverage', 'drink', 'soda', 'water', 'juice', 'cola', 'tea', 'coffee', 'milk'],
  'snacks': ['snack', 'cookie', 'chip', 'crisp', 'bar', 'biscuit', 'popcorn', 'cracker', 'wafer', 'chocolate'],
  'dairies': ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'fromage'],
  'fruits': ['fruit', 'apple', 'banana', 'berry', 'orange', 'grape', 'mango', 'citrus'],
  'vegetables': ['vegetable', 'salad', 'carrot', 'tomato', 'spinach', 'potato', 'onion', 'greens'],
  'breads': ['bread', 'toast', 'baguette', 'bun', 'bakery', 'flour', 'dough'],
  'meats': ['meat', 'beef', 'chicken', 'pork', 'poultry', 'sausage', 'ham', 'bacon', 'fish', 'tuna'],
  'frozen-foods': ['frozen', 'ice cream', 'pizza'],
  'sauces': ['sauce', 'ketchup', 'mayo', 'dressing', 'condiment', 'mustard', 'oil', 'dip']
};

function applyProductFilters() {
  if (!state.hasSearched) return;

  let list = [...state.searchedProducts];

  // 1. Nutri-Score filter
  if (state.activeNutriGrade) {
    list = list.filter(p => (p.nutritionGrade || '').toLowerCase() === state.activeNutriGrade.toLowerCase());
  }

  // 2. Category keyword filter
  if (state.activeCategory) {
    const keywords = CATEGORY_KEYWORDS[state.activeCategory] || [state.activeCategory.replace(/-/g, ' ')];
    list = list.filter(p => {
      const text = `${p.category} ${p.name} ${p.brand}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });
  }

  state.currentProducts = list;
  const queryText = state.lastQuery ? ` for "${state.lastQuery}"` : '';
  const message = list.length > 0
    ? `Found ${list.length} products${queryText}`
    : 'No products match your selected category';

  renderProducts(list, message);
}

function handleProductCategoryClick(catKey) {
  if (!state.hasSearched) {
    showNotification('Please search for a product first, then select categories.', 'info');
    return;
  }

  state.activeCategory = (state.activeCategory === catKey) ? null : catKey;

  document.querySelectorAll('.product-category-btn').forEach(btn => {
    const isActive = btn.dataset.category === state.activeCategory;
    btn.style.opacity = isActive ? '1' : '0.7';
    btn.style.transform = isActive ? 'scale(1.04)' : '';
    btn.style.boxShadow = isActive ? '0 4px 12px rgba(0,0,0,0.25)' : '';
  });

  applyProductFilters();
}

async function searchProducts(query) {
  const clean = (query || '').trim();
  if (!clean) {
    resetProductScanner();
    return;
  }

  state.hasSearched = true;
  state.lastQuery = clean;
  state.activeCategory = null;

  const loading = document.querySelector('#products-loading');
  const empty = document.querySelector('#products-empty');
  const grid = document.querySelector('#products-grid');
  const countEl = document.querySelector('#products-count');

  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  if (grid) grid.innerHTML = '';
  if (countEl) countEl.textContent = `Searching for "${clean}"...`;

  const data = await fetchJSON(`${API_BASE}/products/search?q=${encodeURIComponent(clean)}&page=1&limit=24`);
  const rawList = data?.results || data?.products || [];
  const normalized = rawList.map(normalizeProduct).filter(Boolean);

  state.searchedProducts = normalized;
  state.currentProducts = normalized;

  // Reset category buttons visual highlight
  document.querySelectorAll('.product-category-btn').forEach(btn => {
    btn.style.opacity = '1';
    btn.style.transform = '';
    btn.style.boxShadow = '';
  });

  const total = data?.pagination?.total || normalized.length;
  const msg = normalized.length > 0
    ? `Found ${total} products for "${clean}"`
    : `No products found for "${clean}"`;

  renderProducts(normalized, msg);
}

async function lookupBarcode(code) {
  const clean = (code || '').trim();
  // Valid barcode is numbers only
  if (!clean || !/^\d+$/.test(clean)) {
    showNotification('Please enter a valid numeric barcode number', 'error');
    return;
  }

  state.hasSearched = true;
  state.lastQuery = clean;
  state.activeCategory = null;

  const loading = document.querySelector('#products-loading');
  const empty = document.querySelector('#products-empty');
  const grid = document.querySelector('#products-grid');

  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  if (grid) grid.innerHTML = '';

  const data = await fetchJSON(`${API_BASE}/products/barcode/${clean}`);
  const raw = data?.result || data?.product;
  const p = normalizeProduct(raw);

  if (p) {
    state.searchedProducts = [p];
    state.currentProducts = [p];
    renderProducts([p], `Found 1 product for barcode: ${clean}`);
    showProductDetailModal(p);
  } else {
    state.searchedProducts = [];
    state.currentProducts = [];
    renderProducts([], `No product found with barcode: ${clean}`);
  }
}

async function showProductDetailModal(product) {
  const oldModal = document.querySelector('#product-detail-modal');
  if (oldModal) oldModal.remove();

  // If ingredients/allergens are missing, fetch supplementary details from Open Food Facts API
  if ((!product.ingredients || !product.allergens) && product.barcode) {
    try {
      const offResp = await fetchJSON(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(product.barcode)}.json`);
      if (offResp?.status === 1 && offResp.product) {
        const offP = offResp.product;
        if (!product.ingredients) {
          product.ingredients = offP.ingredients_text || offP.ingredients_text_it || offP.ingredients_text_en || '';
        }
        if (!product.allergens) {
          const tags = Array.isArray(offP.allergens_tags)
            ? offP.allergens_tags.map(t => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ')).filter(Boolean).join(', ')
            : '';
          product.allergens = offP.allergens || tags || offP.allergens_from_ingredients || '';
        }
        if (!product.quantity && offP.quantity) {
          product.quantity = offP.quantity;
        }
      }
    } catch {
      // Gracefully continue with available data if offline/error
    }
  }

  const modal = document.createElement('div');
  modal.id = 'product-detail-modal';
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4';
  modal.innerHTML = createProductDetailModalHTML(product);
  document.body.appendChild(modal);

  modal.querySelectorAll('.close-product-modal').forEach(btn => {
    btn.onclick = () => modal.remove();
  });
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  const addBtn = modal.querySelector('.add-product-to-log');
  addBtn?.addEventListener('click', () => {
    const nut = product.nutrients || {};
    const cal = Math.round(nut.calories || 0);
    addLog({
      name: product.name,
      calories: cal,
      protein: Math.round(nut.protein || 0),
      carbs: Math.round(nut.carbs || 0),
      fat: Math.round(nut.fat || 0),
      image: product.image,
      servings: 1,
      type: 'product'
    });
    modal.remove();
    showSuccessAlert('Food Logged!', `${product.name} has been added to your daily log.`, cal);
  });
}

// 6. FOOD LOG (CRUD & WEEKLY OVERVIEW)
function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function addLog(item) {
  const logs = getLogs();
  const entry = {
    id: Date.now().toString(),
    name: item.name || 'Food Item',
    calories: Math.round(Number(item.calories) || 0),
    protein: Math.round(Number(item.protein) || 0),
    carbs: Math.round(Number(item.carbs) || 0),
    fat: Math.round(Number(item.fat) || 0),
    servings: Number(item.servings) || 1,
    image: item.image || '',
    type: item.type || 'meal',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: getTodayDateStr()
  };
  logs.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  return entry;
}

function removeLog(id) {
  const logs = getLogs().filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function clearTodayLogs() {
  const allLogs = getLogs();
  const today = getTodayDateStr();
  // Clear items that match today, keep past days for weekly chart
  const remaining = allLogs.filter(i => (i.date || '').split('T')[0] !== today);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  showNotification("Today's log cleared", 'info');
}

function getTodayTotals() {
  const today = getTodayDateStr();
  const todayLogs = getLogs().filter(i => (i.date || '').split('T')[0] === today);
  return todayLogs.reduce((acc, i) => {
    acc.calories += i.calories;
    acc.protein += i.protein;
    acc.carbs += i.carbs;
    acc.fat += i.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function getWeekDays() {
  const now = new Date();
  const days = [];
  // Last 7 days ending with today
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    days.push({
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      dateStr: getTodayDateStr(d),
      isToday: offset === 0
    });
  }
  return days;
}

function updateTodayNutritionDOM(totals) {
  const macros = [
    { key: 'cal', val: totals.calories, target: TARGETS.calories, unit: 'kcal', color: 'emerald' },
    { key: 'protein', val: totals.protein, target: TARGETS.protein, unit: 'g', color: 'blue' },
    { key: 'carbs', val: totals.carbs, target: TARGETS.carbs, unit: 'g', color: 'amber' },
    { key: 'fat', val: totals.fat, target: TARGETS.fat, unit: 'g', color: 'purple' }
  ];

  macros.forEach(m => {
    const percent = Math.min(Math.round((m.val / m.target) * 100), 100);
    const isOver = m.val > m.target;
    const colorClass = isOver ? 'text-red-500' : `text-${m.color}-600`;
    const barBg = isOver ? 'bg-red-500' : `bg-${m.color}-500`;

    const pctEl = document.querySelector(`#prog-${m.key}-pct`);
    if (pctEl) {
      pctEl.textContent = `${percent}%`;
      pctEl.className = `text-xs font-semibold ${colorClass}`;
    }

    const barEl = document.querySelector(`#prog-${m.key}-bar`);
    if (barEl) {
      barEl.style.width = `${percent}%`;
      barEl.className = `h-2.5 rounded-full transition-all ${barBg}`;
    }

    const valEl = document.querySelector(`#prog-${m.key}-val`);
    if (valEl) {
      valEl.textContent = `${m.val} ${m.unit}`;
      valEl.className = `font-medium ${colorClass}`;
    }
  });
}

function renderFoodLogPage() {
  const allLogs = getLogs();
  const today = getTodayDateStr();
  const todayLogs = allLogs.filter(i => (i.date || '').split('T')[0] === today);
  const totals = getTodayTotals();

  // Set date title
  const dateEl = document.querySelector('#foodlog-date');
  if (dateEl) dateEl.textContent = formatTodayDate();

  // Update progress bars
  updateTodayNutritionDOM(totals);

  // Today item count & clear button
  const countTitle = document.querySelector('#foodlog-today-section h4');
  if (countTitle) countTitle.textContent = `Logged Items (${todayLogs.length})`;

  const clearBtn = document.querySelector('#clear-foodlog');
  if (clearBtn) clearBtn.style.display = todayLogs.length > 0 ? 'inline-flex' : 'none';

  // Toggle empty state vs items list
  const emptyEl = document.querySelector('#foodlog-empty-state');
  const listEl = document.querySelector('#logged-items-list');

  if (todayLogs.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (listEl) {
      listEl.style.display = 'none';
      listEl.innerHTML = '';
    }
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    if (listEl) {
      listEl.style.display = 'block';
      listEl.innerHTML = todayLogs.map(createFoodLogItem).join('');
    }
  }

  // Weekly Overview
  const chart = document.querySelector('#weekly-chart');
  if (chart) {
    const weekDays = getWeekDays();
    let totalCal = 0;
    let totalItems = 0;
    let daysOnGoal = 0;

    const daysData = weekDays.map(day => {
      const items = allLogs.filter(i => (i.date || '').split('T')[0] === day.dateStr);
      const cal = items.reduce((sum, i) => sum + i.calories, 0);
      const count = items.length;

      totalCal += cal;
      totalItems += count;
      if (cal >= TARGETS.calories * 0.8 && cal <= TARGETS.calories * 1.2) {
        daysOnGoal++;
      }
      return { ...day, calories: cal, count };
    });

    chart.innerHTML = createWeeklyOverviewGrid(daysData);

    const avgEl = document.querySelector('#weekly-average-val');
    const itemsEl = document.querySelector('#weekly-total-items-val');
    const goalEl = document.querySelector('#weekly-days-goal-val');

    if (avgEl) avgEl.textContent = `${totalCal > 0 ? Math.round(totalCal / 7) : 0} kcal`;
    if (itemsEl) itemsEl.textContent = `${totalItems} items`;
    if (goalEl) goalEl.textContent = `${daysOnGoal} / 7`;
  }
}

// 7. EVENT LISTENERS

function initEvents() {
  // Mobile sidebar toggle
  const sidebar = document.querySelector('#sidebar');
  const overlay = document.querySelector('#sidebar-overlay');
  const toggleSidebar = (force) => {
    if (!sidebar || !overlay) return;
    const open = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    overlay.classList.toggle('active', open);
  };

  document.querySelector('#header-menu-btn')?.addEventListener('click', () => toggleSidebar());
  document.querySelector('#sidebar-close-btn')?.addEventListener('click', () => toggleSidebar(false));
  overlay?.addEventListener('click', () => toggleSidebar(false));

  // Navigation Links
  const routes = ['meals', 'products', 'foodlog'];
  document.querySelectorAll('.nav-link').forEach((link, idx) => {
    link.addEventListener('click', e => {
      e.preventDefault();
      toggleSidebar(false);
      navigate(routes[idx]);
    });
  });

  // Meals Search
  const searchInput = document.querySelector('#search-input');
  let searchTimer = null;
  searchInput?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleMealSearch(e.target.value), 300);
  });

  // Grid/List View Toggle
  const gridBtn = document.querySelector('#grid-view-btn');
  const listBtn = document.querySelector('#list-view-btn');
  if (gridBtn && listBtn) {
    gridBtn.onclick = () => {
      state.isGridView = true;
      gridBtn.className = 'px-3 py-1.5 bg-white rounded-md shadow-sm';
      listBtn.className = 'px-3 py-1.5';
      renderRecipes(state.currentRecipes);
    };
    listBtn.onclick = () => {
      state.isGridView = false;
      listBtn.className = 'px-3 py-1.5 bg-white rounded-md shadow-sm';
      gridBtn.className = 'px-3 py-1.5';
      renderRecipes(state.currentRecipes);
    };
  }

  // Click Recipe Card -> Details
  document.querySelector('#recipes-grid')?.addEventListener('click', e => {
    const card = e.target.closest('.recipe-card');
    if (card?.dataset.mealId) {
      navigate(`meal/${card.dataset.mealId}`);
    }
  });

  document.querySelector('#back-to-meals-btn')?.addEventListener('click', () => navigate('meals'));

  // Log Meal Button
  document.querySelector('#log-meal-btn')?.addEventListener('click', () => {
    if (state.currentMeal) showLogMealModal(state.currentMeal);
  });

  // Product Scanner: Category Buttons
  document.querySelectorAll('#product-categories .product-category-btn').forEach(btn => {
    btn.addEventListener('click', () => handleProductCategoryClick(btn.dataset.category));
  });

  // Product Scanner: Search by Name
  const prodInput = document.querySelector('#product-search-input');
  let prodTimer = null;
  const triggerProdSearch = () => {
    clearTimeout(prodTimer);
    searchProducts(prodInput?.value);
  };

  prodInput?.addEventListener('submit', () => {
    clearTimeout(prodTimer);
    prodTimer = setTimeout(triggerProdSearch, 400);
  });
  prodInput?.addEventListener('keydown', e => { if (e.key === 'Enter') triggerProdSearch(); });
  document.querySelector('#search-product-btn')?.addEventListener('click', triggerProdSearch);

  // Product Scanner: Barcode Lookup
  const barInput = document.querySelector('#barcode-input');
  let barTimer = null;
  const triggerBarSearch = () => {
    clearTimeout(barTimer);
    lookupBarcode(barInput?.value);
  };

  barInput?.addEventListener('submit', e => {
    clearTimeout(barTimer);
    const code = e.target.value.trim();
    if (/^\d{8,14}$/.test(code)) {
      barTimer = setTimeout(() => lookupBarcode(code), 500);
    }
  });
  barInput?.addEventListener('keydown', e => { if (e.key === 'Enter') triggerBarSearch(); });
  document.querySelector('#lookup-barcode-btn')?.addEventListener('click', triggerBarSearch);

  // Nutri-Score Filter
  document.querySelectorAll('.nutri-score-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeNutriGrade = (btn.dataset.grade || '').toLowerCase();
      document.querySelectorAll('.nutri-score-filter').forEach(b => b.classList.remove('ring-2', 'ring-gray-900'));
      btn.classList.add('ring-2', 'ring-gray-900');
      applyProductFilters();
    });
  });

  // Click Product Card -> Open Modal
  document.querySelector('#products-grid')?.addEventListener('click', e => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    const p = state.currentProducts.find(item => item.barcode === card.dataset.barcode);
    if (p) showProductDetailModal(p);
  });

  // Food Log: Delete single item
  document.querySelector('#logged-items-list')?.addEventListener('click', e => {
    const btn = e.target.closest('.delete-log-btn');
    if (btn?.dataset.id) {
      removeLog(btn.dataset.id);
      renderFoodLogPage();
      showNotification('Item removed from log', 'info');
    }
  });

  // Food Log: Clear Today
  document.querySelector('#clear-foodlog')?.addEventListener('click', () => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: "Clear Today's Log?",
        text: 'This will remove all logged food items for today.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, clear it!',
        cancelButtonText: 'Cancel'
      }).then(res => {
        if (res.isConfirmed) {
          clearTodayLogs();
          renderFoodLogPage();
        }
      });
    } else {
      if (confirm("Clear today's logged items?")) {
        clearTodayLogs();
        renderFoodLogPage();
      }
    }
  });

  window.addEventListener('hashchange', handleRoute);

  // Auto-rollover at midnight
  let lastCheckedDate = getTodayDateStr();
  setInterval(() => {
    const current = getTodayDateStr();
    if (current !== lastCheckedDate) {
      lastCheckedDate = current;
      renderFoodLogPage();
    }
  }, 30000);
}


// INITIALIZE APP

async function initApp() {
  initEvents();
  resetProductScanner();

  try {
    const [catData, areaData, mealData] = await Promise.all([
      fetchJSON(`${API_BASE}/meals/categories`),
      fetchJSON(`${API_BASE}/meals/areas`),
      fetchJSON(`${API_BASE}/meals/search?q=chicken&page=1&limit=25`)
    ]);

    state.categories = catData?.results || [];
    state.areas = (areaData?.results || []).map(a => a.name);
    state.allMeals = mealData?.results || [];
    state.currentRecipes = state.allMeals;

    renderAreaChips(state.areas, 'All');
    renderCategories(state.categories);
    renderRecipes(state.currentRecipes);

    handleRoute();
  } catch (err) {
    console.error('Initialization error:', err);
  } finally {
    hideLoadingOverlay();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
