

<template>
  <div class="container py-4">
    <h1 class="mb-3">My Recipes</h1>

    <RecipePreviewList title="My Recipes" endpoint="/users/myRecipes"/>


    <router-link class="btn btn-primary mt-3" :to="{ name: 'main' }">
      Back to Home
    </router-link>
  </div>
</template>

<script >
import RecipePreviewList from '@/components/RecipePreviewList.vue';


export default{
  name: "MyRecipesPage",
  components: {RecipePreviewList},

}
</script>

<style scoped>
/* optional: keep it minimal */
</style>
