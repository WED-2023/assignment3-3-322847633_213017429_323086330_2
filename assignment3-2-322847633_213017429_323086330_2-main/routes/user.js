var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
// router.post('/favorites', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     const recipe_id = req.body.recipeId;
//     await user_utils.markAsFavorite(user_id,recipe_id);
//     res.status(200).send("The Recipe successfully saved as favorite");
//     } catch(error){
//     next(error);
//   }
// })

router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (err) {
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      // already there → treat as success (idempotent)
      return res.status(200).send("Recipe is already in favorites");
    }
    next(err);
  }
});


// DELETE /favorites  (body: { recipeId })
router.delete('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session?.user_id;
    if (!user_id) return res.status(401).json({ message: 'Login required' });

    const recipe_id = req.body?.recipeId;
    if (!recipe_id) return res.status(400).json({ message: 'recipeId is required' });

    await user_utils.unmarkAsFavorite(user_id, recipe_id);

    // 200 with a small JSON payload
    res.status(200).json({ message: 'The recipe was removed from favorites', success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
// router.get('/favorites', async (req,res,next) => {
//   try{
//     const user_id = req.session.user_id;
//     let favorite_recipes = {};
//     const recipes_id = await user_utils.getFavoriteRecipes(user_id);
//     let recipes_id_array = [];
//     recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
//     const results = await recipe_utils.getRecipesPreview(recipes_id_array);
//     res.status(200).send(results);
//   } catch(error){
//     next(error); 
//   }
// });


router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const rows = await user_utils.getFavoriteRecipes(user_id); // [{recipe_id}]
    const ids  = rows.map(e => Number(e.recipe_id)).filter(Number.isFinite);
    const results = await recipe_utils.getRecipesPreview(ids); // now mixed + safe
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});


/**
 * This path gets body with recipeId and save this recipe in the Visited list of the logged-in user
 */

router.post("/visited", async(req, res,next)=>{
  try{
    const user_id= req.session.user_id;
    const recipe_id =req.body.recipeId;
    await user_utils.markAsVisited(user_id,recipe_id);
    res.status(200).send("The Recipe successfully added to visited list");
  }catch(error){
    next(error); 
  }
})


// GET /users/lastVisited?limit=3  -> returns full recipe objects
router.get("/lastVisited", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const q = Number(req.query.limit);
    const limit = Number.isFinite(q) && q > 0 ? Math.min(q, 10) : 3;

    // uses your user_utils.getLastVisited(user_id, limit)
    const ids = await user_utils.getLastVisited(user_id, limit);

    // expand IDs to full recipe details (keeps order)
    const recipes = await Promise.all(ids.map((id) => recipe_utils.getRecipeDetails(id)));

    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the last 3 visited recipes that were saved by the logged-in user
 */
router.get("/visited", async(req, res,next)=>{
  try{
    const user_id = req.session.user_id;
    const visited_lst = await user_utils.getVisitedRecipes(user_id);
    const idList = [];
    
    for (let i = visited_lst.length - 1; i >= 0 && idList.length < 3; i--){
      const recipe_ID = visited_lst[i]["recipe_id"];
      if (idList.includes(recipe_ID)){
        continue;
      }
      idList.push(recipe_ID);
    }
    const result = await Promise.all(idList.map(async (recipe_ID) => {
      return await recipe_utils.getRecipeDetails(recipe_ID);
    }));
    res.status(200).send(result);
  }
  catch(error){
    res.status(400).send("Bad Request")
  }
})


/**
 * This path returns the recipes made by the user with all the details (including the equipment and instructions..)
 */
router.get('/myrecipes/allInformations/:title', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const title = req.params.title;
    const recipes = await user_utils.getMyRecipesDetailed(user_id, title);
    if (recipes.length === 0) {
      res.status(204).send('no recipes found');
    } else {
      res.status(200).send(recipes);
    }
  } catch (error) {
    next(error);
  }
});


/**
 * This path will create a new recipe made by the user and save it to the database
 */
// 

// 

router.post('/createRecipe', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    if (!user_id) return res.status(401).send('Not logged in');

    const toBool = v => v === true || v === 1 || v === '1' || v === 'true';
    const {
      id, title, image, readyInMinutes, popularity,
      vegetarian, vegan, glutenFree,
      extendedIngredients, analyzedInstructions, servings
    } = req.body;

    await user_utils.addRecipe(
      Number(id), user_id, title || '', image || null,
      Number(readyInMinutes) || 0, Number(popularity) || 0,
      toBool(vegetarian) ? 1 : 0, toBool(vegan) ? 1 : 0, toBool(glutenFree) ? 1 : 0,
      JSON.stringify(extendedIngredients ?? []),
      JSON.stringify(analyzedInstructions ?? []),
      Number(servings) || 1
    );

    await user_utils.markAsMyRecipe(user_id, Number(id));
    res.status(200).send('Recipe successfully created and added to MyRecipes.');
  } catch (err) { next(err); }
});



router.get('/AllRecipes', async (req, res, next) => {
  try {
    const recipes = await DButils.execQuery(`SELECT * FROM Recipes`);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});


/**
 * This path save a recipe in the meal list of the user
 */
router.post('/myRecipes', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsMyRecipe(user_id, recipe_id);
    res.status(200).send('The Recipe successfully saved as visited');
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the recipes saved as in the meal list of a user
 */
// router.get('/myRecipes', async (req, res, next) => {
//   try {
//     const user_id = req.session.user_id;
//     const recipes_id = await user_utils.getMyRecipes(user_id);
//     let recipes_id_array = [];
//     recipes_id.map((element) => recipes_id_array.push(element.recipe_id));
//     res.status(200).send(recipes_id);
//   } catch (error) {
//     next(error);
//   }
// });
// route
// router.get('/myRecipes', async (req, res, next) => {
//   try {
//     const user_id = req.session.user_id;
//     if (!user_id) return res.status(401).send('Not logged in');

//     const rows = await user_utils.getMyRecipes(user_id);
//     // send what your UI expects; here I send full rows:
//     res.status(200).json(rows);
//   } catch (err) { next(err); }
// });

router.get('/myRecipes', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    if (!user_id) return res.status(401).send('Not logged in');

    const rows = await user_utils.getMyRecipes(user_id);           // [{recipe_id}]
    const ids  = rows.map(r => Number(r.recipe_id)).filter(Number.isFinite);

    const previews = await recipe_utils.getRecipesPreview(ids);    // mixes local + Spoonacular safely
    // (optional) tag them:
    previews.forEach(r => (r.isMine = true));

    res.status(200).json(previews);
  } catch (err) { next(err); }
});




/////////////family
router.post('/family', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    console.log("Session user_id:", req.session.user_id);
    const {image,title,preparationTime,ingrediants, instructions,recipe_owner_id,  family_prep_time} = req.body;

    await user_utils.addFamilyRecipe(user_id,recipe_owner_id,family_prep_time,image,title,preparationTime,ingrediants,
      instructions);

    res.status(200).send("The Recipe successfully added to family list");
  } catch (error) {
    res.status(401).send("User is not authorized");
  }
});

// GET route to retrieve all family recipes
router.get('/family', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const result = await user_utils.getFamilyRecipes(user_id);
    res.status(200).send(result);
  } catch (error) {
    res.status(401).send("User is not authorized");
  }
});


// -------- MEAL PLAN ROUTES --------

// POST /users/mealPlan  { recipeId|recipe_id, orderNumber|order_number? }
router.post('/mealPlan', async (req, res, next) => {
  try {
    const user_id = req.session?.user_id;
    if (!user_id) return res.status(401).json({ success: false, message: 'Login required' });

    const recipe_id = Number(req.body.recipe_id ?? req.body.recipeId);
    if (!Number.isInteger(recipe_id)) {
      return res.status(400).json({ success: false, message: 'recipeId (number) is required' });
    }

    const order_number = req.body.order_number ?? req.body.orderNumber ?? null; // let util compute if null
    await user_utils.addToMealplan(user_id, recipe_id, order_number);

    res.status(200).json({ success: true, message: 'Recipe added to meal plan' });
  } catch (err) {
    next(err);
  }
});

// GET /users/mealPlan  → list
router.get('/mealPlan', async (req, res, next) => {
  try {
    const user_id = req.session?.user_id;
    if (!user_id) return res.status(401).json({ success: false, message: 'Login required' });

    const mealPlan = await user_utils.getmealplan(user_id);
    res.status(200).json(mealPlan);
  } catch (err) {
    next(err);
  }
});

// PUT /users/mealPlan  { recipeId|recipe_id, newOrder?|order_number?, progress? }
router.put('/mealPlan', async (req, res, next) => {
  try {
    const user_id = req.session?.user_id;
    if (!user_id) return res.status(401).json({ success: false, message: 'Login required' });

    const recipe_id = Number(req.body.recipe_id ?? req.body.recipeId);
    if (!Number.isInteger(recipe_id)) {
      return res.status(400).json({ success: false, message: 'recipeId (number) is required' });
    }

    let newOrder = req.body.newOrder ?? req.body.order_number ?? null;
    if (newOrder != null) {
      newOrder = Number(newOrder);
      if (!Number.isInteger(newOrder) || newOrder < 1) {
        return res.status(400).json({ success: false, message: 'newOrder must be a positive integer' });
      }
    }

    const progress = req.body.progress ?? null; // 'not started' | 'in progress' | 'completed'
    const allowed = new Set(['not started', 'in progress', 'completed']);
    if (progress != null && !allowed.has(progress)) {
      return res.status(400).json({ success: false, message: 'progress is invalid' });
    }

    await user_utils.updatemealplan(user_id, recipe_id, newOrder, progress);
    res.status(200).json({ success: true, message: 'Meal plan updated' });
  } catch (err) {
    next(err);
  }
});

// DELETE /users/mealPlan/:recipeId
router.delete('/mealPlan/:recipeId', async (req, res, next) => {
  try {
    const user_id = req.session?.user_id;
    if (!user_id) return res.status(401).json({ success: false, message: 'Login required' });

    const recipe_id = Number(req.params.recipeId);
    if (!Number.isInteger(recipe_id)) {
      return res.status(400).json({ success: false, message: 'recipeId (number) is required' });
    }

    await user_utils.removeFrompealplan(user_id, recipe_id);
    res.status(200).json({ success: true, message: 'Recipe removed from meal plan' });
  } catch (err) {
    next(err);
  }
});

// DELETE /users/mealPlan  → clear all
router.delete('/mealPlan', async (req, res, next) => {
  try {
    const user_id = req.session?.user_id;
    if (!user_id) return res.status(401).json({ success: false, message: 'Login required' });

    await user_utils.clearmealplan(user_id);
    res.status(200).json({ success: true, message: 'Meal plan cleared' });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
