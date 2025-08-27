var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));

/**
 * This path will get random 3 recipes from the external api
  */
  router.get('/random', async (req, res, next) => {
    try {
      const recipes = await recipes_utils.getRandomRecipes();
      console.log(recipes);
      res.status(200).send(recipes);
    } catch (error) {
      next(error);
    }
  });


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});


/**
 * This path will get all informations for a specific recipe (informations as needed in the assignment )
 */
router.get('/allInformations/:recipeId', async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getAllInformations(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});




/**
 * This path will return recipes giving a query and number of recipes to return
 */  
/**
 * This path will return recipes given a query and number of recipes to return.
 */
router.get('/search/:query/:number?', async (req, res, next) => {
  try {
    const { query } = req.params;
    let { number } = req.params;
    const { cuisine, diet, intolerances, sort } = req.query;

    // Default number to 5 if not provided
    number = number ? Number(number) : 5;

    // Validate number
    if (![5, 10, 15].includes(number)) {
      return res.status(400).send("Invalid value for number. Must be one of: 5, 10, 15");
    }

    // Perform the recipe search
    const searchResults = await recipes_utils.searchRecipes({
      query,
      number,
      cuisine,
      diet,
      intolerances,
      sort,
    });

    if (searchResults.length === 0) {
      return res.status(204).send(); // No Content
    }

    res.status(200).send(searchResults);
  } catch (error) {
    console.error("Error in /search route:", error.message);
    next(error);
  }
});



/**
 * This path will return instructions for the recipe giving a recipe id (bonus)
 */
router.get('/getInstructions/:recipeId', async (req, res, next) => {
  try {
    const instructions = await recipes_utils.getInstructions(req.params.recipeId);
    res.send(instructions);
  } catch (error) {
    next(error);
  }
});

////////// Recipe preparation page
router.get("/prepare/:recipeId", async (req, res, next) => {
  try {
    const recipe_id = req.params.recipeId;
    const recipe = await recipes_utils.getAllInformations(recipe_id);

    const preparationData = {
      ingredients: recipe.extendedIngredients || [],
      instructions: recipe.analyzedInstructions || [],
      servings: recipe.servings || 1,
    };

    res.status(200).send(preparationData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
