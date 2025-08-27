<template>
  <div class="container">
    <h1 class="title">Main Page</h1>

    <RecipePreviewList
        title="Random Recipes"
        endpoint="/recipes/random"
        unwrap-key="recipes"    
      >
        <template #right>
          <LoginPage v-if="!store.username" />
          <RecipePreviewList
            v-else
            :key="store.username"
            title="Last Viewed Recipes"
            endpoint="/users/lastVisited"   
            :limit="3"
            compact
            :show-refresh="false"
          />
        </template>
      </RecipePreviewList>


    <div v-if="!store.username" class="text-center mt-4">
      <router-link :to="{ name: 'login' }">
        <button class="btn btn-primary">You need to Login to view this</button>
      </router-link>
    </div>
  </div>
</template>

<script>
import { getCurrentInstance } from "vue";
import RecipePreviewList from "../components/RecipePreviewList.vue";
import LoginPage from "./LoginPage.vue";

export default {
  components: { RecipePreviewList, LoginPage },
  setup() {
    const inst = getCurrentInstance();
    const store = inst.appContext.config.globalProperties.store;
    return { store };
  }
};
</script>

<style lang="scss" scoped>
.RandomRecipes { margin: 10px 0; }
</style>
