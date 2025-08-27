<template>
  <div class="card h-100 recipe-preview position-relative">
    <span v-if="recipe.isWatched" class="watched-badge"> Watched</span>

    <!-- STAR sits above everything -->
    <button
      type="button"
      class="favorit-btn"
      :class="{ active: isFavorite }"
      @click.stop.prevent="toggleFavorite"
      :aria-pressed="isFavorite ? 'true' : 'false'"
      :aria-label="isFavorite ? 'Added to favorites' : 'Add to favorites'"
      :disabled="loading || !rid"
      title="Add to favorites"
    >
      <span class="star">{{ isFavorite ? '★' : '☆' }}</span>
    </button>

    <!-- Clickable area that navigates -->
    <router-link :to="toRecipe" class="recipe-link d-block">
      <div class="img-wrap hover-clickable">
        <img
          v-if="image_load && !hasImageError && recipe.image"
          :src="recipe.image"
          class="card-img-top recipe-image"
          :alt="recipe.title || 'Recipe image'"
          @error="onImgError"
        />
        <div v-else class="card-img-top d-flex align-items-center justify-content-center recipe-image placeholder">
          <span class="text-muted">No image</span>
        </div>
        <div class="hover-overlay"><span class="hover-text">Click to open</span></div>
      </div>

      <div class="card-body text-center">
        <h5 class="card-title text-truncate" :title="recipe.title">{{ recipe.title }}</h5>
        <div class="d-flex justify-content-center gap-3 small text-secondary mb-2">
          <div v-if="displayMinutes">{{ displayMinutes }} min</div>
          <div v-if="likes !== null">{{ likes }}</div>
        </div>
        <div class="d-flex justify-content-center gap-2 mb-2">
          <span v-if="recipe.glutenFree" class="badge bg-warning text-dark">GF</span>
          <span v-if="recipe.vegan" class="badge bg-success">Vegan</span>
          <span v-else-if="recipe.vegetarian" class="badge bg-success-subtle text-success-emphasis">Vegetarian</span>
        </div>
        <div v-if="recipe.summary" class="summary small text-start" v-html="recipe.summary"></div>
      </div>
    </router-link>
  </div>
</template>

<script>
export default {
  name: "RecipePreview",
  props: {
    recipe: { type: Object, required: true },
    favoritesEndpoint: { type: String, default: "/users/favorites" },
    title: { type: String, default: "" },
    id: { type: [Number, String], required: false }
  },
  emits: ["favorite-changed"],
  data() {
    return {
      isFavorite: !!this.recipe.isFavorite,
      loading: false,
      image_load: false,
      hasImageError: false
    };
  },
  computed: {
    displayMinutes() {
      return this.recipe?.readyInMinutes ?? this.recipe?.time ?? this.recipe?.preparationTime ?? null;
    },
    likes() {
      return this.recipe?.aggregateLikes ?? this.recipe?.popularity ?? null;
    },
    rid() {
      // accept all common id fields
      return (
        this.id ??
        this.recipe?.id ??
        this.recipe?.recipeId ??
        this.recipe?.recipe_id ??   // <-- important
        this.recipe?._id ??
        null
      );
    },
    toRecipe() {
      if (!this.rid) return { name: "main" };
      const id = String(this.rid);
      return { name: "recipe", params: { id, recipeId: id } };
    }
  },
  watch: {
    "recipe.isFavorite"(v) { this.isFavorite = !!v; },
    "recipe.image": {
      immediate: true,
      handler(newUrl) { this.preloadImage(newUrl); }
    }
  },
  mounted() { this.preloadImage(this.recipe?.image); },
  methods: {
    preloadImage(url) {
      this.image_load = false;
      this.hasImageError = false;
      if (!url) return;
      const img = new Image();
      img.onload = () => (this.image_load = true);
      img.onerror = () => { this.hasImageError = true; this.image_load = false; };
      img.src = url;
    },
    onImgError() {
      this.hasImageError = true;
      this.image_load = false;
    },
    normalizedId() {
      const n = Number(this.rid);
      return Number.isFinite(n) ? n : this.rid;
    },
    async toggleFavorite() {
      if (this.loading || !this.rid) return;
      this.loading = true;
      try {
        const rid = this.normalizedId();
        const payload = { recipeId: rid, recipe_id: rid, id: rid }; // cover server variations

        // ADD ONLY
        await this.axios.post(this.favoritesEndpoint, payload, { withCredentials: true });
        this.isFavorite = true;
        this.$emit("favorite-changed", { recipeId: this.rid, isFavorite: true });
      } catch (e) {
        console.error("[favorite add] error:", e?.response?.status, e?.response?.data || e?.message);
        window.toast?.("Favorites", "Could not add to favorites.", "danger");
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.recipe-link { text-decoration: none; color: inherit; }
.img-wrap { position: relative; }
.recipe-image { width: 100%; height: 200px; object-fit: cover; }
.recipe-image.placeholder { background: #f3f4f6; }
.hover-clickable { cursor: pointer; }
.hover-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0); color: #fff; opacity: 0; transition: opacity .2s, background .2s; pointer-events: none; z-index: 1;
}
.img-wrap:hover .hover-overlay { opacity: 1; background: rgba(0,0,0,.25); }
.hover-text { font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,.4); }

/* star must sit above everything and be clickable */
.favorit-btn {
  position: absolute; right: .5rem; bottom: .5rem; width: 40px; height: 40px; border: 1px solid #ddd;
  border-radius: 50%; background: rgba(255,255,255,.96); display: grid; place-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.12); cursor: pointer; z-index: 3; /* higher than overlay/link */
}
.favorit-btn .star { font-size: 20px; color: #777; }
.favorit-btn.active { background: #ffe58f; border-color: #f5c518; }
.favorit-btn.active .star { color: #f5c518; }
.favorit-btn:disabled { opacity: .6; cursor: not-allowed; }

.watched-badge { position: absolute; top: .5rem; left: .5rem; background: #3b82f6; color: #fff; border-radius: .5rem; padding: .15rem .5rem; font-size: .8rem; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
.summary { max-height: 100px; overflow: auto; background: #f8f9fa; border-radius: .5rem; padding: .5rem .6rem; }
.text-truncate { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
</style>
