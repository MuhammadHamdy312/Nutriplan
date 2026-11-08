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

/* mmmmmmmmmmmmmmmmmmm
   APP STATE
   mmmmmmmmmmmmmmmmmmm */
const state = {
  allMeals: [],
  currentRecipes: [],
  categories: [],
  areas: [],
  currentMeal: null,
  currentNutrition: null,
  isGridView: true,

  // Product Scanner State
  hasSearched: false,       
  lastQuery: '',
  searchedProducts: [],    
  currentProducts: [],      
  activeCategory: null,
  activeNutriGrade: ''
};

/* ------------------
   BASIC FETCH HELPER
   --------------- */
async function fetchJSON(url, options) {
  console.log(`[API] →`, url.replace('https://nutriplan-api.vercel.app/api', '/api'));
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`[API] ✗ ${res.status} ${res.statusText}`, url);
      return null;
    }
    const data = await res.json();
    console.log(`[API] ✓`, url.replace('https://nutriplan-api.vercel.app/api', '/api'), data);
    return data;
  } catch (err) {
    console.error(`[API] ✗ Error`, url, err.message);
    return null;
  }
}

/* 
   DATE & TOAST HELPERS
    */
function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());
}

function getTodayDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isTodayDate(dateVal) {
  if (!dateVal) return false;
  const localToday = getTodayDateStr();
  const isoToday = new Date().toISOString().split('T')[0];
  const clean = String(dateVal).split('T')[0].trim();
  return clean === localToday || clean === isoToday;
}

function getWeekDays() {
  const now = new Date();
  const list = [];

  // Rolling series of 7 consecutive days ending with Today
  for (let o = 6; o >= 0; o--) {
    const d = new Date(now);
    d.setDate(now.getDate() - o);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    const isoDateStr = d.toISOString().split('T')[0];
    list.push({
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      date: d.getDate(),
      dateStr: localDateStr,
      isoDateStr: isoDateStr,
      isToday: o === 0
    });
  }
  return list;
}

function showNotification(msg, type = 'info') {
  const old = document.querySelector('.toast-notification');
  if (old) old.remove();

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

const showToast = showNotification;

function showSuccessAlert(title, text, cal) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title,
      html: `<p class="text-gray-600 text-sm">${text}</p>${cal ? `<p class="text-emerald-600 font-bold text-lg mt-2">+${cal} calories</p>` : ''}`,
      icon: 'success',
      confirmButtonColor: '#10b981',
      timer: 2000,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-3xl shadow-2xl', title: 'text-2xl font-bold text-gray-900'
      }
    });
  } else {
    const existing = document.querySelector('#success-modal-fallback');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'success-modal-fallback';
    overlay.className = 'fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in';
    overlay.innerHTML = `
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
          <i class="fa-solid fa-check text-emerald-500 text-3xl"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">${title}</h3>
        <p class="text-gray-600 text-sm mb-2">${text}</p>
        ${cal ? `<p class="text-emerald-600 font-bold text-lg">+${cal} calories</p>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2000);
  }
}

/* 
   FOOD LOG (LocalStorage CRUD)
   */
const STORAGE_KEY = 'nutriplan_food_log';
const TARGETS = { calories: 2000, protein: 50, carbs: 250, fat: 65 };

function getLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
  const all = getLogs();
  // تصفية العناصر بحيث تقتصر حصراً على عناصر اليوم، مع الاحتفاظ بجميع عناصر الأيام السابقة في السجل من أجل "نظرة عامة أسبوعية
  const remaining = all.filter(i => !isTodayDate(i.date));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  showNotification("Today's log cleared", "info");
}

const clearLogs = clearTodayLogs;

function getTodayTotals() {
  const logs = getLogs().filter(i => isTodayDate(i.date));
  return logs.reduce((acc, i) => {
    acc.calories += i.calories;
    acc.protein += i.protein;
    acc.carbs += i.carbs;
    acc.fat += i.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

/* 
   ROUTING & PAGE VIEW
   */
function showPage(page) {
  const mealsSections = [
    document.querySelector('#search-filters-section'),
    document.querySelector('#meal-categories-section'),
    document.querySelector('#all-recipes-section')
  ];
  const detailsSec = document.querySelector('#meal-details');
  const prodSec = document.querySelector('#products-section');
  const foodSec = document.querySelector('#foodlog-section');

  mealsSections.forEach(s => s && (s.style.display = 'none'));
  if (detailsSec) detailsSec.style.display = 'none';
  if (prodSec) prodSec.style.display = 'none';
  if (foodSec) foodSec.style.display = 'none';

  const pages = ['meals', 'products', 'foodlog'];
  document.querySelectorAll('.nav-link').forEach((link, idx) => {
    const active = (pages[idx] === page) || (page === 'meal-detail' && idx === 0);
    link.className = active
      ? 'nav-link flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold transition-all'
      : 'nav-link flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all';
  });

  const headers = {
    meals: ['Meals & Recipes', 'Discover delicious and nutritious recipes tailored for you'],
    'meal-detail': ['Recipe Details', 'View full recipe information and nutrition facts'],
    products: ['Product Scanner', 'Search packaged foods by name or barcode'],
    foodlog: ['Food Log', 'Track your daily nutrition and food intake']
  };

  const h1 = document.querySelector('header h1');
  const p = document.querySelector('header p');
  if (headers[page] && h1 && p) {
    h1.textContent = headers[page][0];
    p.textContent = headers[page][1];
  }

  if (page === 'meals') mealsSections.forEach(s => s && (s.style.display = ''));
  else if (page === 'meal-detail' && detailsSec) detailsSec.style.display = '';
  else if (page === 'products') {
    if (prodSec) prodSec.style.display = '';
    // Do not display any products until user searches 
    if (!state.hasSearched) resetProductScanner();
  }
  else if (page === 'foodlog') {
    if (foodSec) foodSec.style.display = '';
    renderFoodLogPage();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRoute() {
  const hash = window.location.hash.slice(1);
  if (hash === 'products') showPage('products');
  else if (hash === 'foodlog') showPage('foodlog'); else if (hash.startsWith('meal/')) openMealDetail(hash.split('/')[1]);
  else showPage('meals');
}

function navigate(route) {
  window.location.hash = route;
}

/* 
   MEALS & RECIPES (Regex Search)
   */
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

  const allowed = Object.keys(CATEGORY_CONFIG);
  const list = categories.filter(c => allowed.includes(c.name || c.strCategory)).slice(0, 12);
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

// Regex search for meals
function searchMealsWithRegex(query, list) {
  if (!query || !query.trim()) return list;
  // Construct case-insensitive regular expression with escaped special characters
  const pattern = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(pattern, 'i');

  return list.filter(m => {
    const name = m.name || m.strMeal || '';
    const cat = m.category || m.strCategory || '';
    const area = m.area || m.strArea || '';
    const inst = Array.isArray(m.instructions) ? m.instructions.join(' ') : (m.instructions || m.strInstructions || '');
    return regex.test(name) || regex.test(cat) || regex.test(area) || regex.test(inst);
  });
}

async function handleMealSearch(query) {
  if (!query) {
    state.currentRecipes = state.allMeals;
    renderRecipes(state.currentRecipes);
    return;
  }

  const grid = document.querySelector('#recipes-grid');
  if (grid) grid.innerHTML = getLoadingSpinner();

  const data = await fetchJSON(`${API_BASE}/meals/search?q=${encodeURIComponent(query)}&page=1&limit=25`);
  const pool = (data?.results && data.results.length > 0) ? data.results : state.allMeals;
  state.currentRecipes = searchMealsWithRegex(query, pool);
  renderRecipes(state.currentRecipes);
}

async function openMealDetail(id) {
  showPage('meal-detail');
  const data = await fetchJSON(`${API_BASE}/meals/${id}`);
  const meal = data?.result;
  if (!meal) return;
  state.currentMeal = meal;

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

  const heroCalories = document.querySelector('#hero-calories');
  const heroServings = document.querySelector('#hero-servings');
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

  const ingredients = meal.ingredients || [];
  const ingCount = document.querySelector('#meal-detail-ing-count');
  if (ingCount) ingCount.textContent = `${ingredients.length} items`;

  const ingGrid = document.querySelector('#meal-ingredients-list');
  if (ingGrid) ingGrid.innerHTML = createIngredientsList(ingredients);

  const stepsContainer = document.querySelector('#meal-instructions-list');
  if (stepsContainer) stepsContainer.innerHTML = createInstructionsList(meal.instructions);

  const videoCard = document.querySelector('#meal-video-card');
  const iframe = document.querySelector('#meal-detail-video');
  if (iframe) {
    const match = (meal.youtube || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) {
      iframe.src = `https://www.youtube.com/embed/${match[1]}`;
      if (videoCard) videoCard.style.display = 'block';
    } else {
      iframe.style.display = 'none';
    
    }
  }

  // Fetch Nutrition
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

  // Populate static Nutrition Facts without regenerating HTML
  if (nutLoading) nutLoading.classList.add('hidden');
  if (nutContent) {
    nutContent.classList.remove('hidden');
    const setTxt = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    const setWidth = (sel, pct) => { const el = document.querySelector(sel); if (el) el.style.width = `${pct}%`; };

    setTxt('#nut-cal-val', perServing.calories || 0);
    setTxt('#nut-total-cal-val', totals.calories || (perServing.calories || 0) * 4);

    setTxt('#nut-protein-val', `${perServing.protein || 0}g`);
    setWidth('#nut-protein-bar', Math.min(100, Math.round(((perServing.protein || 0) / 50) * 100)));

    setTxt('#nut-carbs-val', `${perServing.carbs || 0}g`);
    setWidth('#nut-carbs-bar', Math.min(100, Math.round(((perServing.carbs || 0) / 250) * 100)));

    setTxt('#nut-fat-val', `${perServing.fat || 0}g`);
    setWidth('#nut-fat-bar', Math.min(100, Math.round(((perServing.fat || 0) / 65) * 100)));

    setTxt('#nut-fiber-val', `${perServing.fiber || 0}g`);
    setWidth('#nut-fiber-bar', Math.min(100, Math.round(((perServing.fiber || 0) / 28) * 100)));

    setTxt('#nut-sugar-val', `${perServing.sugar || 0}g`);
    setWidth('#nut-sugar-bar', Math.min(100, Math.round(((perServing.sugar || 0) / 50) * 100)));

    setTxt('#nut-satfat-val', `${perServing.saturatedFat || 0}g`);
    setWidth('#nut-satfat-bar', Math.min(100, Math.round(((perServing.saturatedFat || 0) / 20) * 100)));

    setTxt('#nut-cholesterol-val', `${perServing.cholesterol || 0}mg`);
    setTxt('#nut-sodium-val', `${perServing.sodium || 0}mg`);
  }
}

function showLogMealModal(meal) {
  let servings = 1;
  const perServing = state.currentNutrition?.perServing || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = createLogMealModalHTML(meal, perServing, servings);

  const update = () => {
    modal.querySelector('#modal-calories').textContent = Math.round(perServing.calories * servings);
    modal.querySelector('#modal-protein').textContent = `${Math.round(perServing.protein * servings)}g`;
    modal.querySelector('#modal-carbs').textContent = `${Math.round(perServing.carbs * servings)}g`;
    modal.querySelector('#modal-fat').textContent = `${Math.round(perServing.fat * servings)}g`;
    modal.querySelector('#meal-servings').value = servings;
  };

  document.body.appendChild(modal);

  modal.querySelector('#decrease-servings').onclick = () => {
    if (servings > 0.5) { servings -= 0.5; update(); }
  };
  modal.querySelector('#increase-servings').onclick = () => {
    if (servings < 10) { servings += 0.5; update(); }
  };
  modal.querySelector('#cancel-log-meal').onclick = () => { modal.remove(); };
  modal.onclick = e => { if (e.target === modal) { modal.remove(); } };

  modal.querySelector('#confirm-log-meal').onclick = () => {
    const cal = Math.round(perServing.calories * servings);
    addLog({
      name: meal.name || meal.strMeal,
      calories: cal,
      protein: Math.round(perServing.protein * servings),
      carbs: Math.round(perServing.carbs * servings),
      fat: Math.round(perServing.fat * servings),
      image: meal.thumbnail || meal.strMealThumb,
      servings,
      type: 'meal'
    });
    modal.remove();
    showSuccessAlert('Meal Logged!', `${meal.name || meal.strMeal} (1 serving) has been added to your daily log.`, cal);
  };
}

/* 
   PRODUCT SCANNER (Regex Validation & Filtering)
*/
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

// Regex Category matcher patterns
const CATEGORY_REGEX = {
  'breakfast-cereals': /cereal|breakfast|oat|granola|muesli|flake|porridge/i,
  'beverages': /beverage|drink|soda|water|juice|cola|tea|coffee|milk|liquid/i,
  'snacks': /snack|cookie|chip|crisp|bar|biscuit|popcorn|cracker|wafer|chocolate/i,
  'dairies': /dairy|milk|cheese|yogurt|butter|cream|fromage/i,
  'fruits': /fruit|apple|banana|berry|orange|grape|mango|citrus/i,
  'vegetables': /vegetable|salad|carrot|tomato|spinach|potato|onion|greens/i,
  'breads': /bread|toast|baguette|bun|bakery|flour|dough/i,
  'meats': /meat|beef|chicken|pork|poultry|sausage|ham|bacon|fish|tuna/i,
  'frozen-foods': /frozen|ice cream|pizza/i,
  'sauces': /sauce|ketchup|mayo|dressing|condiment|mustard|oil|dip/i
};

// Filter searched products using Regex
function applyProductFilters() {
  if (!state.hasSearched) return;

  let list = [...state.searchedProducts];

  // Nutri-Score regex filter
  if (state.activeNutriGrade) {
    const gradeRegex = new RegExp(`^${state.activeNutriGrade}$`, 'i');
    list = list.filter(p => gradeRegex.test(p.nutritionGrade || ''));
  }

  // Category regex filter
  if (state.activeCategory) {
    const catRegex = CATEGORY_REGEX[state.activeCategory] || new RegExp(state.activeCategory.replace(/-/g, '.*'), 'i');
    list = list.filter(p => catRegex.test(`${p.category} ${p.name} ${p.brand}`));
  }

  state.currentProducts = list;
  const queryStr = state.lastQuery ? ` for "${state.lastQuery}"` : '';
  const msg = list.length > 0
    ? `Found ${list.length} products${queryStr}`
    : `No products match your selected category`;
  renderProducts(list, msg);
}

// Handle Category click: only active AFTER search
function handleProductCategoryClick(catKey) {
  if (!state.hasSearched) {
    showToast('Please search for a product first, then select categories.', 'info');
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

// Search products by name (Regex validation + API)
async function searchProducts(query) {

  if (!query || !/[a-zA-Z0-9]/.test(query.trim())) {
    resetProductScanner();
    return;
  }

  const cleanQuery = query.trim();
  state.hasSearched = true;
  state.lastQuery = cleanQuery;
  state.activeCategory = null;

  const loading = document.querySelector('#products-loading');
  const empty = document.querySelector('#products-empty');
  const grid = document.querySelector('#products-grid');
  const countEl = document.querySelector('#products-count');

  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  if (grid) grid.innerHTML = '';
  if (countEl) countEl.textContent = `Searching for "${cleanQuery}"...`;

  const data = await fetchJSON(`${API_BASE}/products/search?q=${encodeURIComponent(cleanQuery)}&page=1&limit=24`);
  const rawList = data?.results || data?.products || [];
  const normalized = rawList.map(toP => normalizeProduct(toP));

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
    ? `Found ${total} products for "${cleanQuery}"`
    : `No products found for "${cleanQuery}"`;

  renderProducts(normalized, msg);
}

// Lookup by Barcode (Regex validation + API)
async function lookupBarcode(code) {
  // Regex: 4-16 digits only
  const barcodeRegex = /^\d{4,16}$/;
  const cleanCode = (code || '').trim();

  if (!cleanCode || !barcodeRegex.test(cleanCode)) {
    showToast('Please enter a valid numeric barcode number', 'error');
    return;
  }

  state.hasSearched = true;
  state.lastQuery = cleanCode;
  state.activeCategory = null;

  const loading = document.querySelector('#products-loading');
  const empty = document.querySelector('#products-empty');
  const grid = document.querySelector('#products-grid');

  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  if (grid) grid.innerHTML = '';

  const data = await fetchJSON(`${API_BASE}/products/barcode/${cleanCode}`);
  const raw = data?.result || data?.product;
  const p = normalizeProduct(raw);

  if (p) {
    state.searchedProducts = [p];
    state.currentProducts = [p];
    renderProducts([p], `Found 1 product for barcode: ${cleanCode}`);
    showProductDetailModal(p);
  } else {
    state.searchedProducts = [];
    state.currentProducts = [];
    renderProducts([], `No product found with barcode: ${cleanCode}`);
  }
}

// Product Detail Modal
async function showProductDetailModal(product) {
  const old = document.querySelector('#product-detail-modal');
  if (old) old.remove();

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
    } catch (e) {
      // Gracefully continue with available data if offline/error
    }
  }

  const modal = document.createElement('div');
  modal.id = 'product-detail-modal';
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4';
  modal.innerHTML = createProductDetailModalHTML(product);

  document.body.appendChild(modal);

  modal.querySelectorAll('.close-product-modal').forEach(btn => {
    btn.onclick = () => { modal.remove(); };
  });
  modal.onclick = e => { if (e.target === modal) { modal.remove(); } };

  const addBtn = modal.querySelector('.add-product-to-log, #add-product-to-log');
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

/* mmmmmmmmmmmmm
   FOOD LOG PAGE
 mmmmmmmmmmmmmmm*/
function updateTodayNutritionDOM(totals, targets) {
  const macros = [
    { key: 'cal', val: totals.calories, target: targets.calories, unit: 'kcal', color: 'emerald' },
    { key: 'protein', val: totals.protein, target: targets.protein, unit: 'g', color: 'blue' },
    { key: 'carbs', val: totals.carbs, target: targets.carbs, unit: 'g', color: 'amber' },
    { key: 'fat', val: totals.fat, target: targets.fat, unit: 'g', color: 'purple' }
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
  //عرض العناصر على اليوم فقط: بمجرد انتهاء اليوم، تصبح قائمة العناصر المسجلة لهذا اليوم فارغة.
  const todayLogs = allLogs.filter(i => isTodayDate(i.date));
  const totals = getTodayTotals();


  const dateEl = document.querySelector('#foodlog-date');
  if (dateEl) dateEl.textContent = formatToday();

  // Progress Cards: update static DOM elements directly
  updateTodayNutritionDOM(totals, TARGETS);

  // Today count & Clear button
  const countH4 = document.querySelector('#foodlog-today-section h4');
  if (countH4) countH4.textContent = `Logged Items (${todayLogs.length})`;

  const clearBtn = document.querySelector('#clear-foodlog');
  if (clearBtn) clearBtn.style.display = todayLogs.length > 0 ? 'inline-flex' : 'none';

  // Items List & Empty State: static empty state toggled
  const emptyEl = document.querySelector('#foodlog-empty-state');
  const listEl = document.querySelector('#logged-items-list');
  if (todayLogs.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (listEl) {
      listEl.style.display = 'none';
      listEl.innerHTML = '';
    }
  }
  else {
    if (emptyEl) emptyEl.style.display = 'none';
    if (listEl) {
      listEl.style.display = 'block';
      listEl.innerHTML = todayLogs.map(createFoodLogItem).join('');
    }
  }

  // Weekly Overview (Rolling series of last 7 days ending with Today)
  const chart = document.querySelector('#weekly-chart');
  if (chart) {
    const weekDays = getWeekDays();
    let totalCal = 0;
    let totalItems = 0;
    let daysOnGoal = 0;

    const daysData = weekDays.map(day => {
      const items = allLogs.filter(i => {
        if (!i.date) return false;
        const dStr = String(i.date).split('T')[0].trim();
        return dStr === day.dateStr || dStr === day.isoDateStr;
      });
      const cal = items.reduce((sum, i) => sum + i.calories, 0);
      const count = items.length;
      totalCal += cal;
      totalItems += count;
      if (cal > 0 && cal >= TARGETS.calories * 0.8 && cal <= TARGETS.calories * 1.2) {
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

/* mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
   INITIALIZATION & EVENT BINDINGS
   mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm */
function initEvents() {
  //  sidebar
  const sidebar = document.querySelector('#sidebar');
  const overlay = document.querySelector('#sidebar-overlay');
  const toggleSb = force => {
    if (!sidebar || !overlay) return;
    const open = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    overlay.classList.toggle('active', open);
  };
  document.querySelector('#header-menu-btn')?.addEventListener('click', () => { toggleSb(); });
  document.querySelector('#sidebar-close-btn')?.addEventListener('click', () => { toggleSb(false); });
  overlay?.addEventListener('click', () => { toggleSb(false); });

  // Navigation Links
  const routes = ['meals', 'products', 'foodlog'];
  document.querySelectorAll('.nav-link').forEach((link, idx) => {
    link.addEventListener('click', e => {
      e.preventDefault();
      toggleSb(false);
      navigate(routes[idx]);
    });
  });

  // Meals Search with Regex
  const searchInput = document.querySelector('#search-input');
  let searchTimer = null;
  searchInput?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleMealSearch(e.target.value.trim()), 300);
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

  // Click Recipe Card  Details
  document.querySelector('#recipes-grid')?.addEventListener('click', e => {
    const card = e.target.closest('.recipe-card');
    if (card?.dataset.mealId) {
      navigate(`meal/${card.dataset.mealId}`);
    }
  });

  //    Back to meals button
  document.querySelector('#back-to-meals-btn')?.addEventListener('click', () => { navigate('meals'); });

  // Log Meal Button
  document.querySelector('#log-meal-btn')?.addEventListener('click', () => {
    if (state.currentMeal) showLogMealModal(state.currentMeal);
  });

  // Product Scanner: Categories buttons
  document.querySelectorAll('#product-categories .product-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleProductCategoryClick(btn.dataset.category);
    });
  });

  // Product Scanner: Search by name
  const prodInput = document.querySelector('#product-search-input');
  let prodTimer = null;
  const triggerProdSearch = () => {
    clearTimeout(prodTimer);
    searchProducts(prodInput?.value.trim());
  };

  prodInput?.addEventListener('submit', e => {
    clearTimeout(prodTimer);
    const val = e.target.value.trim();
    if (!val) {
      resetProductScanner();
      return;
    }
    prodTimer = setTimeout(() => searchProducts(val), 400);
  });
  prodInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { triggerProdSearch(); } });
  document.querySelector('#search-product-btn')?.addEventListener('click', triggerProdSearch);

  // Product Scanner: Barcode lookup
  const barInput = document.querySelector('#barcode-input');
  let barTimer = null;
  const triggerBarSearch = () => {
    clearTimeout(barTimer);
    lookupBarcode(barInput?.value.trim());
  };

  barInput?.addEventListener('input', e => {
    clearTimeout(barTimer);
    const code = e.target.value.trim();
    if (/^\d{8,14}$/.test(code)) {
      barTimer = setTimeout(() => lookupBarcode(code), 500);
    }
  });
  barInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { triggerBarSearch(); } });
  document.querySelector('#lookup-barcode-btn')?.addEventListener('click', triggerBarSearch);

  // Nutri-Score Filter (Regex)
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

  // Food Log: Clear All
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
          clearLogs();
          renderFoodLogPage();
          Swal.fire({
            title: 'Cleared!',
            text: 'Your food log has been cleared.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    } else {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-amber-500/30 flex items-center justify-center text-amber-500 text-3xl font-bold">!</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Clear Today's Log?</h3>
          <p class="text-gray-600 text-sm mb-6">This will remove all logged food items for today.</p>
          <div class="flex gap-3">
            <button id="swal-fb-confirm" class="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 cursor-pointer">Yes, clear it!</button>
            <button id="swal-fb-cancel" class="flex-1 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 cursor-pointer">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#swal-fb-cancel').onclick = () => modal.remove();
      modal.querySelector('#swal-fb-confirm').onclick = () => {
        modal.remove();
        clearLogs();
        renderFoodLogPage();
      };
    }
  });

  window.addEventListener('hashchange', handleRoute);

  // <--Automatic rollover: when a day ends at midnight, automatically reset Today's Logged Items view-->
  let lastCheckedDate = getTodayDateStr();
  setInterval(() => {
    const current = getTodayDateStr();
    if (current !== lastCheckedDate) {
      lastCheckedDate = current;
      renderFoodLogPage();
    }
  }, 30000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const current = getTodayDateStr();
      if (current !== lastCheckedDate) {
        lastCheckedDate = current;
        renderFoodLogPage();
      }
    }
  });
}

// Loading Overlay
function hideLoadingOverlay() {
  const overlay = document.querySelector('#app-loading-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.5s ease-out';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
    }, 500);
  }
}

// App Initialization
async function initApp() {
  initEvents();
  resetProductScanner();

  try {
    // Load initial data
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
