const DButils = require("./DButils");
const mysql  = require("mysql2"); // ✅ add this

// async function markAsFavorite(user_id, recipe_id){
//     await DButils.execQuery(`insert into favoriterecipes values ('${user_id}',${recipe_id})`);
// }
async function markAsFavorite(user_id, recipe_id){
  const sql = mysql.format(
    `INSERT IGNORE INTO favoriterecipes (user_id, recipe_id)
     VALUES (?, ?)`,
    [String(user_id), Number(recipe_id)]
  );
  await DButils.execQuery(sql);   // will NOT throw on duplicates
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favoriterecipes where user_id='${user_id}'`);
    return recipes_id;
}

// Watched
async function getVisitedRecipes(userID){
    const query = `select * from visitedrecipes where user_id='${userID}' `
    return await DButils.execQuery(query);
}

async function markAsVisited(userID, recipe_id) {
  const q = `
    INSERT INTO visitedrecipes (userID, recipe_id, visited_at)
    VALUES ('${userID}', '${recipe_id}', NOW())
    ON DUPLICATE KEY UPDATE visited_at = NOW()
  `;
  await DButils.execQuery(q);
}

// user_utils.js
// async function markAsVisited(user_id, recipe_id){
//   await DButils.execQuery(`
//     INSERT INTO visitedrecipes (user_id, recipe_id, visited_at)
//     VALUES ('${user_id}', '${recipe_id}', NOW())
//     ON DUPLICATE KEY UPDATE visited_at = VALUES(visited_at)
//   `);
// }


async function getLastVisited(user_id, limit = 3) {
  // Try using viewed_at if the column exists
  try {
    const rows = await DButils.execQuery(
      `SELECT recipe_id, viewed_at
       FROM visitedrecipes
       WHERE userID='${user_id}'
       ORDER BY viewed_at DESC`
    );

    const unique = [];
    for (const r of rows) {
      if (!unique.includes(r.recipe_id)) unique.push(r.recipe_id);
      if (unique.length === limit) break;
    }
    return unique;
  } catch (e) {
    // Fallback: no viewed_at column – grab all and compute with newest-last heuristic
    const rows = await DButils.execQuery(
      `SELECT recipe_id
       FROM visitedrecipes
       WHERE userID='${user_id}'`
    );
    const unique = [];
    for (let i = rows.length - 1; i >= 0 && unique.length < limit; i--) {
      const rid = rows[i].recipe_id;
      if (!unique.includes(rid)) unique.push(rid);
    }
    return unique;
  }
}



async function getMyRecipesDetailed(user_id, title) {
  const recipe =
    await DButils.execQuery(`SELECT title, image, readyInMinutes, popularity, vegetarian, vegan, glutenFree,
  extendedIngredients, analyzedInstructions, servings FROM recipes WHERE user_id = '${user_id}' AND title = '${title}'`);
  return recipe;
}


///////////add recipe
// async function addRecipe(user_id, r) {
//   await DButils.execQuery(
//     `INSERT INTO Recipes
//       (user_id, title, image, readyInMinutes, popularity, vegetarian,
//        vegan, glutenFree, extendedIngredients, analyzedInstructions, servings)
//      VALUES
//       ('${user_id}', '${r.title}', '${r.image}', ${r.readyInMinutes},
//        ${r.popularity}, ${r.vegetarian}, ${r.vegan}, ${r.glutenFree},
//        '${JSON.stringify(r.extendedIngredients)}',
//        '${JSON.stringify(r.analyzedInstructions)}',
//        ${r.servings})`
//   );
// }


async function addRecipe(
  id,
  user_id,
  title,
  image,
  readyInMinutes,
  popularity,
  vegetarian,
  vegan,
  glutenFree,
  extendedIngredients,
  analyzedInstructions,
  servings
) {
  const query = `
    INSERT INTO recipes (
      id, user_id, title, image, readyInMinutes, popularity,
      vegetarian, vegan, glutenFree,
      extendedIngredients, analyzedInstructions, servings
    ) VALUES (
      '${id}',
      '${user_id}',
      '${title}',
      '${image}',
      '${readyInMinutes}',
      '${popularity}',
      '${vegetarian}',
      '${vegan}',
      '${glutenFree}',
      '${extendedIngredients}',
      '${analyzedInstructions}',
      '${servings}'
    )
  `;
  await DButils.execQuery(query);
}





//////myRecipes
async function markAsMyRecipe(user_id, recipe_id) {
  await DButils.execQuery(`insert into myrecipes (user_id, recipe_id) values ('${user_id}','${recipe_id}')`);
}

async function getMyRecipes(user_id) {
  const recipes_id = await DButils.execQuery(`SELECT recipe_id FROM myrecipes WHERE user_id = '${user_id}'`);
  return recipes_id;
}



/////////////familyRecipes
async function addFamilyRecipe(user_id, originator, occasion, image, title, prep_time, ingredients, instructions) {
  const query = `
    INSERT INTO familyrecipes (user_id, originator, occasion, image_url, title, preparationTime, ingredients, instructions)
    VALUES ('${user_id}', '${originator}', '${occasion}', '${image}', '${title}', '${prep_time}', '${ingredients}', '${instructions}')
  `;
  await DButils.execQuery(query);
}

async function getFamilyRecipes(user_id) {
  const query = `
    SELECT id, title, originator, occasion, ingredients, instructions, image_url
    FROM familyrecipes
    WHERE user_id = '${user_id}'
  `;
  return await DButils.execQuery(query);
}

async function addToMealplan(user_id, recipeId, orderNumber = null) {
  recipeId = Number(recipeId);
  if (!Number.isInteger(recipeId)) throw new Error('recipeId must be integer');

  // 1) Compute next order if not provided
  if (orderNumber == null) {
    const qNext = mysql.format(
      'SELECT COALESCE(MAX(order_number), 0) + 1 AS next FROM mealplan WHERE user_id = ?',
      [user_id]
    );
    const rows = await DButils.execQuery(qNext);
    orderNumber = rows?.[0]?.next || 1;
  } else {
    orderNumber = Number(orderNumber);
    if (!Number.isInteger(orderNumber) || orderNumber < 1) {
      throw new Error('orderNumber must be a positive integer');
    }
  }

  // 2) Upsert (portable): check exists, then UPDATE or INSERT
  const qExists = mysql.format(
    'SELECT 1 FROM mealplan WHERE user_id = ? AND recipe_id = ? LIMIT 1',
    [user_id, recipeId]
  );
  const exists = await DButils.execQuery(qExists);

  const progress = 'not started'; // must match ENUM exactly

  if (exists.length) {
    const qUpd = mysql.format(
      'UPDATE mealplan SET order_number = ?, progress = ? WHERE user_id = ? AND recipe_id = ?',
      [orderNumber, progress, user_id, recipeId]
    );
    await DButils.execQuery(qUpd);
  } else {
    const qIns = mysql.format(
      'INSERT INTO mealplan (user_id, recipe_id, order_number, progress, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, recipeId, orderNumber, progress]
    );
    await DButils.execQuery(qIns);
  }
}

async function getmealplan(user_id) {
  const q = mysql.format(
    `SELECT user_id, recipe_id, order_number, progress, created_at
     FROM mealplan
     WHERE user_id = ?
     ORDER BY order_number ASC`,
    [user_id]
  );
  return await DButils.execQuery(q);
}

async function updatemealplan(user_id, recipeId, newOrder = null, progress = null) {
  recipeId = Number(recipeId);
  const sets = [];
  const params = [];

  if (newOrder != null) {
    newOrder = Number(newOrder);
    if (!Number.isInteger(newOrder) || newOrder < 1) {
      throw new Error('newOrder must be a positive integer');
    }
    sets.push('order_number = ?');
    params.push(newOrder);
  }
  if (progress != null) {
    // valid: 'not started' | 'in progress' | 'completed'
    sets.push('progress = ?');
    params.push(progress);
  }
  if (!sets.length) return;

  params.push(user_id, recipeId);
  const q = mysql.format(
    `UPDATE mealplan SET ${sets.join(', ')} WHERE user_id = ? AND recipe_id = ?`,
    params
  );
  await DButils.execQuery(q);
}

async function removeFrompealplan(user_id, recipeId) {
  const q = mysql.format(
    'DELETE FROM mealplan WHERE user_id = ? AND recipe_id = ?',
    [user_id, Number(recipeId)]
  );
  await DButils.execQuery(q);
}

async function clearmealplan(user_id) {
  const q = mysql.format('DELETE FROM mealplan WHERE user_id = ?', [user_id]);
  await DButils.execQuery(q);
}


exports.clearmealplan=clearmealplan
exports.removeFrompealplan=removeFrompealplan
exports.updatemealplan=updatemealplan
exports.getmealplan=getmealplan
exports.addToMealplan=addToMealplan
exports.addRecipe=addRecipe
exports.markAsVisited=markAsVisited
exports.getVisitedRecipes=getVisitedRecipes
exports.getMyRecipesDetailed=getMyRecipesDetailed
exports.addRecipe=addRecipe
exports.markAsMyRecipe=markAsMyRecipe
exports.getMyRecipes=getMyRecipes
exports.getFamilyRecipes=getFamilyRecipes
exports.addFamilyRecipe=addFamilyRecipe
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getLastVisited      = getLastVisited;       // ✅ new helper
