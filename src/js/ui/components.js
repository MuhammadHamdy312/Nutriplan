/**
 * NutriPlan - UI Components
 * 
 */

//  Loading Spinner Design
export function getLoadingSpinner() {
  return `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  `;
}

//Empty State Design 
export function getEmptyState(message = 'No recipes found', subMessage = 'Try searching for something else') {
  return `
    <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-search text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">${message}</p>
      <p class="text-gray-400 text-sm mt-2">${subMessage}</p>
    </div>
  `;
}

// Category Configuration with exact Tailwind gradients and icons
export const CATEGORY_CONFIG = {
  Beef: { bg: 'from-red-50 to-rose-50', border: 'border-red-200 hover:border-red-400', iconFrom: 'from-red-400', iconTo: 'to-rose-500', text: 'text-red-600', icon: 'fa-drumstick-bite' },
  Chicken: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200 hover:border-amber-400', iconFrom: 'from-amber-400', iconTo: 'to-orange-500', text: 'text-amber-600', icon: 'fa-drumstick-bite' },
  Dessert: { bg: 'from-pink-50 to-rose-50', border: 'border-pink-200 hover:border-pink-400', iconFrom: 'from-pink-400', iconTo: 'to-rose-500', text: 'text-pink-600', icon: 'fa-cake-candles' },
  Lamb: { bg: 'from-orange-50 to-amber-50', border: 'border-orange-200 hover:border-orange-400', iconFrom: 'from-orange-400', iconTo: 'to-amber-500', text: 'text-orange-600', icon: 'fa-drumstick-bite' },
  Miscellaneous: { bg: 'from-slate-50 to-gray-50', border: 'border-slate-200 hover:border-slate-400', iconFrom: 'from-slate-400', iconTo: 'to-gray-500', text: 'text-slate-600', icon: 'fa-bowl-rice' },
  Pasta: { bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200 hover:border-yellow-400', iconFrom: 'from-yellow-400', iconTo: 'to-amber-500', text: 'text-yellow-600', icon: 'fa-bowl-food' },
  Pork: { bg: 'from-rose-50 to-red-50', border: 'border-rose-200 hover:border-rose-400', iconFrom: 'from-rose-400', iconTo: 'to-red-500', text: 'text-rose-600', icon: 'fa-bacon' },
  Seafood: { bg: 'from-cyan-50 to-blue-50', border: 'border-cyan-200 hover:border-cyan-400', iconFrom: 'from-cyan-400', iconTo: 'to-blue-500', text: 'text-cyan-600', icon: 'fa-fish' },
  Side: { bg: 'from-green-50 to-emerald-50', border: 'border-green-200 hover:border-green-400', iconFrom: 'from-green-400', iconTo: 'to-emerald-500', text: 'text-green-600', icon: 'fa-plate-wheat' },
  Starter: { bg: 'from-teal-50 to-cyan-50', border: 'border-teal-200 hover:border-teal-400', iconFrom: 'from-teal-400', iconTo: 'to-cyan-500', text: 'text-teal-600', icon: 'fa-utensils' },
  Vegan: { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200 hover:border-emerald-400', iconFrom: 'from-emerald-400', iconTo: 'to-green-500', text: 'text-emerald-600', icon: 'fa-leaf' },
  Vegetarian: { bg: 'from-lime-50 to-green-50', border: 'border-lime-200 hover:border-lime-400', iconFrom: 'from-lime-400', iconTo: 'to-green-500', text: 'text-lime-600', icon: 'fa-seedling' }

};

// Category Card Design (12 Categories Grid) 
export function createCategoryCard(category) {
  const name = category.name || category.strCategory || '';
  const style = CATEGORY_CONFIG[name] || CATEGORY_CONFIG.Miscellaneous;

  return `
    <div
      class="category-card bg-gradient-to-br ${style.bg} rounded-xl p-3 border ${style.border} hover:shadow-md cursor-pointer transition-all group"
      data-category="${name}"
    >
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 bg-gradient-to-br ${style.iconFrom} ${style.iconTo} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shrink-0">
          <i class="fa-solid ${style.icon} text-white text-sm"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-900">${name}</h3>
        </div>
      </div>
    </div>
  `;
}

//  Area Filter Chip
export function createAreaChip(area, isActive = false) {
  const isAll = area === 'All Cuisines';
  const val = isAll ? 'All' : area;
  const cls = isActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  return `<button class="area-filter-btn px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all cursor-pointer ${cls}" data-area="${val}">${area}</button>`;
}

// Recipe Card Design
export function createRecipeCard(meal, isGridView = true) {
  const id = meal.id || meal.idMeal || '';
  const title = meal.name || meal.strMeal || 'Recipe';
  const image = meal.thumbnail || meal.strMealThumb || '';
  const category = meal.category || meal.strCategory || 'Various';
  const area = meal.area || meal.strArea || 'International';
  const rawDesc = Array.isArray(meal.instructions) ? meal.instructions.join(' ') : (meal.strInstructions || meal.instructions || 'Delicious recipe to try!');
  const desc = rawDesc.slice(0, 100) + '...';

  // Badges floating over image
  const floatingBadges = `
    <div class="absolute bottom-3 left-3 flex gap-2">
      ${category ? `
        <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg text-gray-700 flex items-center">
          <i class="fa-solid fa-tag text-emerald-600 mr-1"></i>${category}
        </span>
      ` : ''}
      ${area ? `
        <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg text-gray-700 flex items-center">
          <i class="fa-solid fa-globe text-blue-600 mr-1"></i>${area}
        </span>
      ` : ''}
    </div>
  `;

  // Footer Tags
  const footerTags = `
    <div class="flex items-center justify-between text-xs pt-3">
      <span class="font-semibold text-gray-900 flex items-center">
        <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>
        ${category}
      </span>
      <span class="font-semibold text-gray-500 flex items-center">
        <i class="fa-solid fa-globe text-blue-500 mr-1"></i>
        ${area}
      </span>
    </div>
  `;

  // 1. Grid View Card
  if (isGridView) {
    return `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between" data-meal-id="${id}">
        <div class="relative h-48 overflow-hidden bg-gray-100">
          <img 
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            src="${image}" 
            alt="${title}"
            loading="lazy"
          />
          ${floatingBadges}
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
              ${title}
            </h3>
            <p class="text-xs text-gray-600 mb-3 line-clamp-2">
              ${desc}
            </p>
          </div>
          ${footerTags}
        </div>
      </div>
    `;
  }

  // 2. List View Card
  return `
    <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-row h-40" data-meal-id="${id}">
      <div class="relative w-48 h-full shrink-0 overflow-hidden bg-gray-100">
        <img 
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          src="${image}" 
          alt="${title}"
          loading="lazy"
        />
        
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
            ${title}
          </h3>
          <p class="text-xs text-gray-600 mb-2 line-clamp-2">
            ${desc}
          </p>
        </div>
        ${footerTags}
      </div>
    </div>
  `;
}

// Nutri-Score Helper
export function getNutriScoreInfo(grade) {
  const g = (grade || '').toLowerCase();
  const map = {
    a: { label: 'Excellent', color: '#038141' },
    b: { label: 'Good', color: '#85bb2f' },
    c: { label: 'Average', color: '#fecb02' },
    d: { label: 'Poor', color: '#ee8100' },
    e: { label: 'Bad', color: '#e63e11' }
  };
  return map[g] || { label: 'Unknown', color: '#9ca3af' };
}

// NOVA Group Helper
export function getNovaGroupInfo(nova) {
  const n = String(nova || '');
  const map = {
    '1': { label: 'Unprocessed', color: '#038141' },
    '2': { label: 'Processed Ingredients', color: '#85bb2f' },
    '3': { label: 'Processed', color: '#ee8100' },
    '4': { label: 'Ultra-processed', color: '#e63e11' }
  };
  return map[n] || { label: 'Unknown', color: '#9ca3af' };
}

// Product Card Design
export function createProductCard(product) {
  const barcode = product.barcode || product.code || '';
  const name = product.name || product.product_name || product.product_name_en || 'Product Name';
  const brand = product.brand || product.brands || 'Unknown Brand';
  const image = product.image || product.image_url || product.image_front_url || product.image_small_url || '';
  const quantity = product.quantity || '';

  const rawGrade = product.nutritionGrade || product.nutriscore_grade || '';
  const grade = (rawGrade || '').toUpperCase();
  const gradeColors = {
    A: 'bg-green-500',
    B: 'bg-lime-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    E: 'bg-red-500'
  };
  const gradeBg = gradeColors[grade] || 'bg-gray-400';

  const novaColors = {
    1: 'bg-green-500',
    2: 'bg-lime-500',
    3: 'bg-orange-500',
    4: 'bg-red-500'
  };
  const nova = product.novaGroup || product.nova_group || '';
  const novaBg = novaColors[nova] || 'bg-gray-400';

  const nutrients = product.nutrients || product.nutrition || product.nutriments || {};
  const kcal = Math.round(nutrients.calories || nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0);
  const protein = parseFloat(nutrients.protein || nutrients.proteins_100g || nutrients.proteins || 0).toFixed(1);
  const carbs = parseFloat(nutrients.carbs || nutrients.carbohydrates_100g || nutrients.carbohydrates || 0).toFixed(1);
  const fat = parseFloat(nutrients.fat || nutrients.fat_100g || 0).toFixed(1);
  const sugar = parseFloat(nutrients.sugar || nutrients.sugars_100g || nutrients.sugars || 0).toFixed(1);

  return `
    <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${barcode}">
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        ${image ? `
          <img 
            class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
            src="${image}" 
            alt="${name}"
            loading="lazy"
            onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center\\'><i class=\\'fa-solid fa-box text-gray-400 text-2xl\\'></i></div>'"
          />
        ` : `
          <div class="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
            <i class="fa-solid fa-box text-gray-400 text-2xl"></i>
          </div>
        `}
        
        ${grade ? `
          <div class="absolute top-2 left-2 ${gradeBg} text-white text-xs font-bold px-2 py-1 rounded uppercase">
            Nutri-Score ${grade}
          </div>
        ` : ''}
        
        ${nova ? `
          <div class="absolute top-2 right-2 ${novaBg} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm" title="NOVA ${nova}">
            ${nova}
          </div>
        ` : ''}
      </div>
      
      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${brand}</p>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors text-sm">
          ${name}
        </h3>
        
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          ${quantity ? `<span><i class="fa-solid fa-weight-scale mr-1"></i>${quantity}</span>` : ''}
          ${kcal ? `<span><i class="fa-solid fa-fire mr-1"></i>${kcal} kcal/100g</span>` : ''}
        </div>
        
        <!-- Mini Nutrition -->
        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="bg-emerald-50 rounded p-1.5">
            <p class="text-xs font-bold text-emerald-700">${protein}g</p>
            <p class="text-[10px] text-gray-500">Protein</p>
          </div>
          <div class="bg-blue-50 rounded p-1.5">
            <p class="text-xs font-bold text-blue-700">${carbs}g</p>
            <p class="text-[10px] text-gray-500">Carbs</p>
          </div>
          <div class="bg-purple-50 rounded p-1.5">
            <p class="text-xs font-bold text-purple-700">${fat}g</p>
            <p class="text-[10px] text-gray-500">Fat</p>
          </div>
          <div class="bg-orange-50 rounded p-1.5">
            <p class="text-xs font-bold text-orange-700">${sugar}g</p>
            <p class="text-[10px] text-gray-500">Sugar</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Food Log Item Design 
export function createFoodLogItem(item) {
  const isProduct = item.type === 'product';
  return `
    <div class="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all border border-gray-100 group">
      <div class="flex items-center gap-4">
        ${item.image ? `
          <img src="${item.image}" alt="${item.name}" class="w-14 h-14 rounded-xl object-cover" />
        ` : `
          <div class="w-14 h-14 ${isProduct ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'} rounded-xl flex items-center justify-center text-xl">
            <i class="fa-solid fa-${isProduct ? 'box' : 'utensils'}"></i>
          </div>
        `}
        <div>
          <p class="font-semibold text-gray-900">${item.name}</p>
          <p class="text-sm text-gray-500">
            ${item.servings || 1} serving${item.servings !== 1 ? 's' : ''}
            <span class="mx-1">•</span>
            <span class="${isProduct ? 'text-blue-600' : 'text-emerald-600'} font-medium">${isProduct ? 'Product' : 'Recipe'}</span>
          </p>
          <p class="text-xs text-gray-400 mt-1">${item.time || 'Time not available'}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-lg font-bold text-emerald-600">${item.calories}</p>
          <p class="text-xs text-gray-500">kcal</p>
        </div>
        <div class="hidden md:flex gap-2 text-xs font-semibold">
          <span class="px-2 py-1 bg-blue-50 rounded">${item.protein}g P</span>
          <span class="px-2 py-1 bg-amber-50 rounded">${item.carbs}g C</span>
          <span class="px-2 py-1 bg-purple-50  rounded">${item.fat}g F</span>
        </div>
        <button class="delete-log-btn text-gray-400 hover:text-red-500 p-2 cursor-pointer transition-colors" data-id="${item.id}" title="Remove from log">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
}

//  Food Log Weekly Overview Grid 
export function createWeeklyOverviewGrid(daysData) {
  return `
    <div class="grid grid-cols-7 gap-2">
      ${daysData.map(d => `
        <div class="text-center p-3 transition-all ${d.isToday ? 'bg-indigo-100 rounded-xl' : ''}">
          <p class="text-xs text-gray-500 mb-1">${d.dayName || d.name}</p>
          <p class="text-sm font-medium text-gray-900">${d.date || d.num}</p>
          <div class="mt-2 ${d.calories > 0 ? 'text-emerald-600' : 'text-gray-300'}">
            <p class="text-lg font-bold">${d.calories}</p>
            <p class="text-xs">kcal</p>
          </div>
          ${(d.itemCount || d.count) > 0 ? `<p class="text-xs text-gray-400 mt-1">${d.itemCount || d.count} items</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// mmmmmmmmmmmmmmmmm Recipe Ingredients List 
export function createIngredientsList(ingredients = []) {
  return ingredients.map(i => `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
      <input type="checkbox" class="w-5 h-5 text-emerald-600 rounded border-gray-300 cursor-pointer" />
      <span class="text-gray-700"><span class="font-bold text-gray-900">${i.measure || ''}</span> ${i.ingredient}</span>
    </div>
  `).join('');
}

//  Recipe Instructions List 
export function createInstructionsList(instructions = []) {
  const list = Array.isArray(instructions) ? instructions : (instructions || '').split(/\r?\n+/).filter(Boolean);
  return list.map((step, idx) => `
    <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
      <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${idx + 1}</div>
      <p class="text-gray-700 leading-relaxed pt-2">${step}</p>
    </div>
  `).join('');
}

//  Log This Meal Modal HTML 
export function createLogMealModalHTML(meal, perServing, servings = 1) {
  return `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <div class="flex items-center gap-4 mb-6">
        <img src="${meal.thumbnail || meal.strMealThumb}" alt="${meal.name || meal.strMeal}" class="w-16 h-16 rounded-xl object-cover" />
        <div>
          <h3 class="text-xl font-bold text-gray-900">Log This Meal</h3>
          <p class="text-gray-500 text-sm">${meal.name || meal.strMeal}</p>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Number of Servings</label>
        <div class="flex items-center gap-3">
          <button id="decrease-servings" class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-all">
            <i class="fa-solid fa-minus text-gray-600"></i>
          </button>
          <input type="number" id="meal-servings" value="${servings}" min="0.5" max="10" step="0.5"
            class="w-20 text-center text-xl font-bold border-2 border-gray-200 rounded-lg py-2 focus:outline-none focus:border-blue-500" />
          <button id="increase-servings" class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-all">
            <i class="fa-solid fa-plus text-gray-600"></i>
          </button>
        </div>
      </div>

      <div class="bg-emerald-50 rounded-xl p-4 mb-6">
        <p class="text-sm text-gray-600 mb-2 font-medium">Estimated nutrition per serving:</p>
        <div class="grid grid-cols-4 gap-2 text-center">
          <div>
            <p class="text-lg font-bold text-emerald-600" id="modal-calories">${Math.round(perServing.calories * servings)}</p>
            <p class="text-xs text-gray-500">Calories</p>
          </div>
          <div>
            <p class="text-lg font-bold text-blue-600" id="modal-protein">${Math.round(perServing.protein * servings)}g</p>
            <p class="text-xs text-gray-500">Protein</p>
          </div>
          <div>
            <p class="text-lg font-bold text-amber-600" id="modal-carbs">${Math.round(perServing.carbs * servings)}g</p>
            <p class="text-xs text-gray-500">Carbs</p>
          </div>
          <div>
            <p class="text-lg font-bold text-purple-600" id="modal-fat">${Math.round(perServing.fat * servings)}g</p>
            <p class="text-xs text-gray-500">Fat</p>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button id="cancel-log-meal" class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all cursor-pointer">
          Cancel
        </button>
        <button id="confirm-log-meal" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-200">
          <i class="fa-solid fa-clipboard-list mr-1"></i>
          Log Meal
        </button>
      </div>
    </div>
  `;
}

// Product Detail Modal HTML
export function createProductDetailModalHTML(product) {
  const nutrients = product.nutrients || product.nutrition || product.nutriments || {};
  const cal = Math.round(nutrients.calories || nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0);
  const protein = parseFloat(nutrients.protein || nutrients.proteins_100g || nutrients.proteins || 0).toFixed(1);
  const carbs = parseFloat(nutrients.carbs || nutrients.carbohydrates_100g || nutrients.carbohydrates || 0).toFixed(1);
  const fat = parseFloat(nutrients.fat || nutrients.fat_100g || 0).toFixed(1);
  const sugar = parseFloat(nutrients.sugar || nutrients.sugars_100g || nutrients.sugars || 0).toFixed(1);
  const saturatedFat = parseFloat(nutrients.saturatedFat || nutrients['saturated-fat_100g'] || 0).toFixed(1);
  const fiber = parseFloat(nutrients.fiber || nutrients.fiber_100g || 0).toFixed(1);
  const sodiumOrSalt = nutrients.salt || nutrients.salt_100g || nutrients.sodium || nutrients.sodium_100g || 0;
  const salt = parseFloat(sodiumOrSalt).toFixed(2);

  const rawGrade = (product.nutritionGrade || product.nutriscore_grade || '').toLowerCase();
  const nutri = getNutriScoreInfo(rawGrade);
  const nova = product.novaGroup || product.nova_group || '';
  const novaInfo = getNovaGroupInfo(nova);

  const image = product.image || product.image_url || product.image_front_url || '';
  const name = product.name || product.product_name || 'Product Details';
  const brand = product.brand || product.brands || 'Unknown Brand';
  const quantity = product.quantity || '';
  const ingredients = product.ingredients || product.ingredients_text || '';
  const allergens = product.allergens || '';

  return `
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-start gap-6 mb-6">
          <div class="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0 p-2">
            ${image ? `
              <img src="${image}" alt="${name}" class="w-full h-full object-contain" />
            ` : `
              <i class="fa-solid fa-box text-gray-400 text-4xl"></i>
            `}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-emerald-600 font-semibold mb-1">${brand}</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">${name}</h2>
            ${quantity ? `<p class="text-sm text-gray-500 mb-3">${quantity}</p>` : '<p class="text-sm text-gray-500 mb-3"></p>'}
            
            <div class="flex items-center gap-3 flex-wrap">
              ${(rawGrade && rawGrade !== 'unknown') ? `
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background-color: ${nutri.color}20">
                  <span class="w-8 h-8 rounded flex items-center justify-center text-white font-bold" style="background-color: ${nutri.color}">
                    ${rawGrade.toUpperCase()}
                  </span>
                  <div>
                    <p class="text-xs font-bold" style="color: ${nutri.color}">Nutri-Score</p>
                    <p class="text-[10px] text-gray-600">${nutri.label}</p>
                  </div>
                </div>
              ` : ''}
              
              ${nova ? `
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background-color: ${novaInfo.color}20">
                  <span class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style="background-color: ${novaInfo.color}">
                    ${nova}
                  </span>
                  <div>
                    <p class="text-xs font-bold" style="color: ${novaInfo.color}">NOVA</p>
                    <p class="text-[10px] text-gray-600">${novaInfo.label}</p>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
          <button class="close-product-modal text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors shrink-0">
            <i class="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        <!-- Nutrition Facts -->
        <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 mb-6 border border-emerald-200" style="background: linear-gradient(to bottom right, #ecfdf5, #f0fdfa); border-color: #a7f3d0;">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i class="fa-solid fa-chart-pie text-emerald-600"></i>
            Nutrition Facts <span class="text-sm font-normal text-gray-500">(per 100g)</span>
          </h3>

          <div class="text-center mb-4 pb-4 border-b border-emerald-200" style="border-color: #a7f3d0;">
            <p class="text-4xl font-bold text-gray-900">${cal}</p>
            <p class="text-sm text-gray-500">Calories</p>
          </div>

          <div class="gap-4 text-center mb-4" style="display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important;">
            <div class="text-center">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2" style="height: 8px; background-color: #e5e7eb; border-radius: 9999px; overflow: hidden;">
                <div class="bg-emerald-500 h-2 rounded-full" style="height: 100%; width: ${Math.min((protein / 50) * 100, 100)}%; background-color: #10b981; border-radius: 9999px;"></div>
              </div>
              <p class="text-lg font-bold text-emerald-600">${protein}g</p>
              <p class="text-xs text-gray-500">Protein</p>
            </div>
            <div class="text-center">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2" style="height: 8px; background-color: #e5e7eb; border-radius: 9999px; overflow: hidden;">
                <div class="bg-blue-500 h-2 rounded-full" style="height: 100%; width: ${Math.min((carbs / 100) * 100, 100)}%; background-color: #3b82f6; border-radius: 9999px;"></div>
              </div>
              <p class="text-lg font-bold text-blue-600">${carbs}g</p>
              <p class="text-xs text-gray-500">Carbs</p>
            </div>
            <div class="text-center">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2" style="height: 8px; background-color: #e5e7eb; border-radius: 9999px; overflow: hidden;">
                <div class="bg-purple-500 h-2 rounded-full" style="height: 100%; width: ${Math.min((fat / 65) * 100, 100)}%; background-color: #a855f7; border-radius: 9999px;"></div>
              </div>
              <p class="text-lg font-bold text-purple-600">${fat}g</p>
              <p class="text-xs text-gray-500">Fat</p>
            </div>
            <div class="text-center">
              <div class="w-full bg-gray-200 rounded-full h-2 mb-2" style="height: 8px; background-color: #e5e7eb; border-radius: 9999px; overflow: hidden;">
                <div class="bg-orange-500 h-2 rounded-full" style="height: 100%; width: ${Math.min((sugar / 50) * 100, 100)}%; background-color: #f97316; border-radius: 9999px;"></div>
              </div>
              <p class="text-lg font-bold text-orange-600">${sugar}g</p>
              <p class="text-xs text-gray-500">Sugar</p>
            </div>
          </div>

          <div class="gap-4 mt-4 pt-4 border-t border-emerald-200 text-center" style="display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; border-color: #a7f3d0;">
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-900">${saturatedFat}g</p>
              <p class="text-xs text-gray-500">Saturated Fat</p>
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-900">${fiber}g</p>
              <p class="text-xs text-gray-500">Fiber</p>
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-900">${salt}g</p>
              <p class="text-xs text-gray-500">Salt</p>
            </div>
          </div>
        </div>

        <!-- Additional Info: Ingredients -->
        ${ingredients ? `
          <div class="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <i class="fa-solid fa-list text-gray-600"></i>
              Ingredients
            </h3>
            <p class="text-sm text-gray-600 leading-relaxed">${ingredients}</p>
          </div>
        ` : ''}

        <!-- Additional Info: Allergens -->
        ${allergens ? `
          <div class="bg-red-50 rounded-xl p-5 mb-6 border border-red-200">
            <h3 class="font-bold text-red-700 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Allergens
            </h3>
            <p class="text-sm text-red-600">${allergens}</p>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex gap-3">
          <button class="add-product-to-log flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-2" data-barcode="${product.barcode}">
            <i class="fa-solid fa-plus mr-2"></i>Log This Food
          </button>
          <button class="close-product-modal flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}
