<template>
  <div class="container py-4">
    <h1 class="mb-3">Favorite Recipes</h1>
    <RecipePreviewList title="My Favorits" endpoint="/users/favorites"/>

    <router-link class="btn btn-primary mt-3" :to="{ name: 'main' }">
      Back to Home
    </router-link>
  </div>
</template>

<script >
import RecipePreviewList from '@/components/RecipePreviewList.vue';


export default{
  name: "FavoritesPage",
  components: {RecipePreviewList},

}
</script>


<style scoped></style>
