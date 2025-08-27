import Main from "../pages/MainPage.vue";
import NotFound from "../pages/NotFoundPage.vue";
import Login from "../pages/LoginPage.vue"
import RecipeViewPage from "../pages/RecipeViewPage.vue";
import About from "@/pages/About.vue";
import FavoritesPage from "@/pages/FavoritesPage.vue";
import FamilyPage from "@/pages/FamilyPage.vue";
import MyRecipesPage from "@/pages/MyRecipesPage.vue";
import Register from "@/pages/RegisterPage.vue";
import RecipePrepare from "@/pages/RecipePrepare.vue";
import MealPage from "@/pages/MealPage.vue";
const routes = [
  {
    path: "/",
    name: "main",
    component: Main,
  },
  {
    path: "/mealPlan",
    name: "mealPlan",
    component: MealPage,
  },
  {
    path: "/register",
    name: "register",
    component: Register,
  },
  {
    path: "/login",
    name: "login",
    component: Login,
  },
  {
    path: "/search",
    name: "search",
    component: () => import("../pages/SearchPage.vue"),
  },
  {
    path: "/recipe/:recipeId",
    name: "recipe",
    component: RecipeViewPage
  },
  {
    path: "/prepare/:recipeId",
    name: "prepare",
    component: RecipePrepare
  },

  {
    path: "/:catchAll(.*)",
    name: "notFound",
    component: NotFound,
  },
    {
    path: "/about",
    name: "about",
    component: About,
  },
  {
    path: "/favorites",
    name: "favorites",
    component: FavoritesPage,
  },
  {
    path: "/family",
    name: "family",
    component: FamilyPage,
  },
  {
    path: "/myRecipes",
    name: "myRecipes",
    component: MyRecipesPage,

  }



];

export default routes;
