// utils/recipes_utils.js
// require('dotenv').config();  // optional if you load env elsewhere

const axios   = require("axios");
const mysql   = require("mysql2");           // ✅ needed for mysql.format
const DButils = require("./DButils");        // ✅ needed for execQuery

const api_domain   = "https://api.spoonacular.com/recipes";
const SPOON_API_KEY = process.env.spoonacular_apiKey;  // ✅ use the same key everywhere

/**
 * return 3 random recipes with the specific details
 */
async function getRandomRecipes() {
  try {
    const { data } = await axios.get(`${api_domain}/random`, {
      params: { number: 3, apiKey: SPOON_API_KEY },
    });
    return data.recipes.map((r) => ({
      id:            r.id,
      title:         r.title,
      readyInMinutes:r.readyInMinutes,
      image:         r.image,
      popularity:    r.aggregateLikes,
      vegan:         r.vegan,
      vegetarian:    r.vegetarian,
      glutenFree:    r.glutenFree,
    }));
  } catch (err) {
    console.error('Spoonacular request failed:', err.response?.data || err.message);
    throw err;
  }
}

// ---------- MIXED PREVIEW (local first, then Spoonacular; skip 404s) ----------
async function getRecipesPreview(recipeIdArray = []) {
  const ids = recipeIdArray.map(Number).filter(Number.isFinite);
  if (!ids.length) return [];

  const local = await getLocalRecipePreviewsByIds(ids);
  const localSet = new Set(local.map(r => r.id));

  const externalIds = ids.filter(id => !localSet.has(id));
  const external    = await getSpoonacularPreviewsSafe(externalIds);

  const byId = new Map([...local, ...external].map(r => [r.id, r]));
  return ids.filter(id => byId.has(id)).map(id => byId.get(id));
}

/** Local previews from your DB */
async function getLocalRecipePreviewsByIds(ids) {
  if (!ids.length) return [];
  const sql = mysql.format(
    `SELECT id, title, image, readyInMinutes, popularity, vegetarian, vegan, glutenFree
     FROM recipes
     WHERE id IN (?)`,
    [ids]
  );
  const rows = await DButils.execQuery(sql);
  return rows.map(r => ({
    id: Number(r.id),
    title: r.title,
    image: r.image,
    readyInMinutes: Number(r.readyInMinutes) || 0,
    aggregateLikes: Number(r.popularity) || 0,
    vegetarian: !!r.vegetarian,
    vegan: !!r.vegan,
    glutenFree: !!r.glutenFree,
    _source: "local"
  }));
}

/** Spoonacular previews; never throw (skip 404s/other failures) */
async function getSpoonacularPreviewsSafe(ids) {
  if (!ids.length) return [];
  const results = await Promise.allSettled(
    ids.map(id =>
      axios.get(`${api_domain}/${id}/information`, {
        params: { includeNutrition: false, apiKey: SPOON_API_KEY }
      })
    )
  );
  const ok = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      const d = r.value.data;
      ok.push({
        id: Number(d.id),
        title: d.title,
        image: d.image,
        readyInMinutes: Number(d.readyInMinutes) || 0,
        aggregateLikes: Number(d.aggregateLikes) || 0,
        vegetarian: !!d.vegetarian,
        vegan: !!d.vegan,
        glutenFree: !!d.glutenFree,
        _source: "spoonacular"
      });
    }
    // rejected (404/quota/etc.) → skipped
  }
  return ok;
}

// ---------- existing detail helpers (unchanged except key var) ----------
async function getRecipeInformation(recipe_id) {
  return axios.get(`${api_domain}/${recipe_id}/information`, {
    params: { includeNutrition: false, apiKey: SPOON_API_KEY },
  });
}

async function getRecipeDetails(recipe_id) {
  const { data: r } = await getRecipeInformation(recipe_id);
  return {
    id:            r.id,
    title:         r.title,
    readyInMinutes:r.readyInMinutes,
    image:         r.image,
    popularity:    r.aggregateLikes,
    vegan:         r.vegan,
    vegetarian:    r.vegetarian,
    glutenFree:    r.glutenFree,
  };
}

async function getAllInformations(recipe_id) {
  const { data: r } = await getRecipeInformation(recipe_id);
  return {
    id:                 r.id,
    title:              r.title,
    readyInMinutes:     r.readyInMinutes,
    image:              r.image,
    popularity:         r.aggregateLikes,
    vegan:              r.vegan,
    vegetarian:         r.vegetarian,
    glutenFree:         r.glutenFree,
    extendedIngredients:r.extendedIngredients,
    analyzedInstructions:r.analyzedInstructions,
    servings:           r.servings,
  };
}

async function searchRecipes({ query, number = 5, cuisine, diet, intolerances, sort }) {
  if (!query) throw new Error('query parameter is required');
  try {
    const { data } = await axios.get(`${api_domain}/complexSearch`, {
      params: {
        query,
        number: Number(number),
        cuisine,
        diet,
        intolerances,
        addRecipeInformation: true,
        instructionsRequired: true,
        apiKey: SPOON_API_KEY,
      },
    });

    const results = await Promise.all(
      data.results.map(async (r) => {
        let steps = [];
        try { steps = await getInstructions(r.id); } catch { /* no steps */ }
        return {
          id:             r.id,
          title:          r.title,
          readyInMinutes: r.readyInMinutes,
          image:          r.image,
          popularity:     r.aggregateLikes,
          vegan:          r.vegan,
          vegetarian:     r.vegetarian,
          glutenFree:     r.glutenFree,
          instructions:   steps,
        };
      })
    );

    if (sort === "time")       results.sort((a, b) => a.readyInMinutes - b.readyInMinutes);
    else if (sort === "popularity") results.sort((a, b) => b.popularity - a.popularity);

    return results;
  } catch (err) {
    console.error('searchRecipes error:', err.response?.data || err.message);
    throw new Error('Failed to fetch recipes');
  }
}

async function getInstructions(recipe_id) {
  const { data } = await axios.get(`${api_domain}/${recipe_id}/analyzedInstructions`, {
    params: { stepBreakdown: true, apiKey: SPOON_API_KEY },
  });
  if (!Array.isArray(data) || data.length === 0) throw new Error('No instructions found');
  return data[0].steps;
}

// keep your current export style; just be sure these names are exported
module.exports = {
  getRecipesPreview,
  getRandomRecipes,
  getRecipeDetails,
  getAllInformations,
  searchRecipes,
  getInstructions,
  getLocalRecipePreviewsByIds,
  getSpoonacularPreviewsSafe
};
