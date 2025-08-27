<template>
  <b-container>
    <h3>
      {{ title }}:
      <slot></slot>
    </h3>

    <b-row>
      <b-col cols="12" md="4">
        <div class="recipe-list-compact d-flex flex-column">
          <RecipePreview
            v-for="r in list"
            :key="String(r.id) + '-' + (r.isFavorite ? 1 : 0)"   
            class="recipePreview compact"
            :recipe="r"
            @favorite-changed="onFavoriteChanged"
          />
        </div>

        <div class="text-center mt-3" v-if="!isVisited && showRefresh">
          <b-button variant="outline-primary" :disabled="loading" @click="refresh">
            <b-spinner small class="me-2" v-if="loading" />
            Get 3 new recipes
          </b-button>
        </div>
      </b-col>

      <b-col cols="12" md="8">
        <slot name="right"></slot>
      </b-col>
    </b-row>
  </b-container>
</template>


<script>
import RecipePreview from "./RecipePreview.vue";
import axios from "axios";

export default {
  name: "RecipePreviewList",
  components: { RecipePreview },
  props: {
    title:       { type: String, required: true },
    endpoint:    { type: String, required: true }, // require to avoid accidental ""
    limit:       { type: Number, default: null },
    sort:        { type: String, default: "" },
    showRefresh: { type: Boolean, default: true },
    // optional: support unwrap-key="recipes"
    unwrapKey:   { type: String, default: "" },
  },
  data() {
    return { items: [], loading: false, error: null };
  },
  computed: {
    isVisited() { return /\/users\/(lastVisited|visited)(\?|$)/.test(this.endpoint); },
    list() { return this.limit ? this.items.slice(0, this.limit) : this.items; }
  },
  mounted() { this.updateRecipes(); },
  watch: {
    endpoint() { this.updateRecipes(); },
    sort()     { this.updateRecipes(); }
  },
  methods: {
    unwrapArray(data) {
      if (Array.isArray(data)) return data;
      if (this.unwrapKey && data && typeof data === "object") return data[this.unwrapKey] ?? [];
      return data?.recipes ?? data?.items ?? data?.visited ?? data?.lastViewed ?? [];
    },
    normalize(raw, watchedIdsSet) {
      const r  = raw?.recipe ?? raw;
      const id = r.id ?? r.recipeId ?? r.recipe_id ?? r._id ?? String(Math.random());
      return {
        ...r,
        id,
        title: r.title ?? r.name ?? "Untitled",
        image: r.image ?? r.mainImage ?? r.imageUrl ?? "",
        readyInMinutes: r.readyInMinutes ?? r.time ?? r.preparationTime ?? 0,
        aggregateLikes: r.aggregateLikes ?? r.popularity ?? 0,
        glutenFree: !!r.glutenFree,
        vegetarian: !!r.vegetarian,
        vegan: !!r.vegan,
        isWatched: this.isVisited ? true : (watchedIdsSet?.has?.(id) ?? !!r.wasWatched ?? !!r.isWatched),
        isFavorite: !!r.isFavorite
      };
    },
    async updateRecipes() {
      if (!this.endpoint) return;
      this.loading = true;
      this.error = null;
      try {
        //  relative path; axios.defaults.baseURL adds host
        const { data } = await axios.get(this.endpoint);
        let arr = this.unwrapArray(data) || [];

        let watchedIdsSet = null;
        if (!this.isVisited) {
          try {
            const wr = await axios.get("/users/lastVisited");
            const ids = Array.isArray(wr.data) ? wr.data.map(x => x?.id ?? x?.recipe_id ?? x) : [];
            watchedIdsSet = new Set(ids);
          } catch { /* not logged in — ignore */ }
        }

        if (this.sort === "By time") {
          arr.sort((a, b) =>
            (a.readyInMinutes ?? a.time ?? a.preparationTime ?? 0) -
            (b.readyInMinutes ?? b.time ?? b.preparationTime ?? 0)
          );
        } else if (this.sort === "By popularity") {
          arr.sort((a, b) =>
            (b.aggregateLikes ?? b.popularity ?? 0) -
            (a.aggregateLikes ?? a.popularity ?? 0)
          );
        }

        this.items = arr.map(r => this.normalize(r, watchedIdsSet));
      } catch (err) {
        const status = err?.response?.status;
        if (this.isVisited && status === 401) {
          this.items = []; // not logged in
        } else {
          this.error = err?.response?.data?.message || err?.message || "Failed to load recipes";
          console.error("[RecipePreviewList] fetch error:", status, err?.response?.data || err?.message);
          window.toast?.(this.title, this.error, "danger");
        }
      } finally {
        this.loading = false;
      }
    },
    refresh() { this.updateRecipes(); },
    // If child emits favorite-changed, keep this handler (or remove from template)
    onFavoriteChanged({ recipeId, isFavorite }) {
      const r = this.items.find(x => String(x.id) === String(recipeId));
      if (r) r.isFavorite = !!isFavorite;
    }
  }
};
</script>


<style scoped lang="scss">
.container { min-height: 400px; }
.recipe-list-compact .recipePreview { max-width: 100%; margin-bottom: 12px; }
.recipe-list-compact .recipe-image { height: 90px !important; object-fit: cover; }
.recipe-list-compact .card-title, .recipe-list-compact .recipe-title { font-size: 1rem; margin-bottom: .25rem; }
.recipe-list-compact .meta { font-size: .875rem; }
</style>
