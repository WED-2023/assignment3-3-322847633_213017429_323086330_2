<template>
  <div class="search-page container py-4">
    <!-- Search bar -->
    <div class="hero d-flex flex-column flex-md-row gap-2 align-items-stretch align-items-md-center">
      <input
        v-model.trim="query"
        @keyup.enter="Search"
        type="text"
        class="form-control form-control-lg hero-input shadow-sm"
        placeholder="What would you like to eat?"
      />
      <button
        class="btn btn-primary btn-lg px-4 shadow-sm"
        :disabled="!query"
        @click="Search"
        title="Search"
      >
        Search
      </button>
    </div>

    <!-- Filters -->
    <div class="card shadow-sm mt-3">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-4">
            <label class="form-label">Cuisine</label>
            <input v-model="cuisine" type="text" class="form-control" placeholder="e.g. italian,thai" />
          </div>

          <div class="col-6 col-md-3">
            <label class="form-label">Diet</label>
            <select v-model="diet" class="form-select">
              <option value="">(any)</option>
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="paleo">Paleo</option>
              <option value="ketogenic">Ketogenic</option>
            </select>
          </div>

          <div class="col-12 col-md-3">
            <label class="form-label">Intolerances</label>
            <input v-model="intolerances" type="text" class="form-control" placeholder="e.g. gluten,peanut" />
          </div>

          <div class="col-6 col-md-1">
            <label class="form-label">Number</label>
            <select v-model.number="number" class="form-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="15">15</option>
            </select>
          </div>

          <div class="col-6 col-md-1">
            <label class="form-label">Sort</label>
            <select v-model="sortKey" class="form-select">
              <option value="">(none)</option>
              <option value="time">By time</option>
              <option value="popularity">By popularity</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="mt-4">
      <RecipePreviewList
        title="Search Result"
        :endpoint="endpoint"
        :showRefresh="false"
        :limit="null"
        :sort="sortTitle"
      />
    </div>
  </div>
</template>

<script>
import RecipePreviewList from "@/components/RecipePreviewList.vue";
import { getCurrentInstance, watch, nextTick } from "vue";

export default {
  name: "SearchPage",
  components: { RecipePreviewList },
  data() {
    return {
      // UI inputs
      query: "",
      cuisine: "",
      diet: "",
      intolerances: "",
      number: 5,
      sortKey: "",

      // fetch control
      bump: 0,
      hasSearched: false,

      // last search handling
      lastSearch: null,   // { query,cuisine,diet,intolerances,number,sortKey }
      useLast: false,     // when true, show last search results (inputs stay empty)
    };
  },
  computed: {
    store() {
      // access global store
      return getCurrentInstance().appContext.config.globalProperties.store;
    },
    STORAGE_KEY() {
      // per-user key so other users/browsers don't see it
      const u = this.store?.username || "";
      return u ? `lastSearch:${u}` : null;
    },
    endpoint() {
      // 1) Auto-show last search for current logged-in user (if exists)
      if (this.useLast && this.lastSearch?.query) {
        const n = [5, 10, 15].includes(+this.lastSearch.number) ? +this.lastSearch.number : 5;
        const qs = new URLSearchParams();
        if (this.lastSearch.cuisine)      qs.set("cuisine", this.lastSearch.cuisine);
        if (this.lastSearch.diet)         qs.set("diet", this.lastSearch.diet);
        if (this.lastSearch.intolerances) qs.set("intolerances", this.lastSearch.intolerances);
        if (this.lastSearch.sortKey)      qs.set("sort", this.lastSearch.sortKey);
        qs.set("_t", String(this.bump));
        return `/recipes/search/${encodeURIComponent(this.lastSearch.query)}/${n}?${qs.toString()}`;
      }

      // 2) Manual search only after clicking Search / Enter
      if (!this.hasSearched || !this.query.trim()) return "";

      const n = [5, 10, 15].includes(+this.number) ? +this.number : 5;
      const qs = new URLSearchParams();
      if (this.cuisine)      qs.set("cuisine", this.cuisine);
      if (this.diet)         qs.set("diet", this.diet);
      if (this.intolerances) qs.set("intolerances", this.intolerances);
      if (this.sortKey)      qs.set("sort", this.sortKey);
      qs.set("_t", String(this.bump));
      return `/recipes/search/${encodeURIComponent(this.query.trim())}/${n}?${qs.toString()}`;
    },
    sortTitle() {
      if (this.sortKey === "time") return "By time";
      if (this.sortKey === "popularity") return "By popularity";
      return "";
    }
  },
  mounted() {
    // DO NOT check document.cookie (session cookie is HttpOnly)
    if (this.store?.username) {
      this.tryLoadLastSearch();
    }
    // If user logs in after mount, try again
    watch(
      () => this.store?.username,
      async (val, oldVal) => {
        if (val && !oldVal) {
          await nextTick();
          this.tryLoadLastSearch();
        }
        if (!val) {
          // logged out: stop showing last search
          this.useLast = false;
          this.hasSearched = false;
          this.bump++;
        }
      },
      { immediate: false }
    );
  },
  methods: {
    Search() {
      const q = this.query.trim();
      if (!q) {
        this.hasSearched = false;
        this.useLast = false;
        this.bump++;
        return;
      }
      if (![5, 10, 15].includes(+this.number)) this.number = 5;

      // Use current inputs
      this.useLast = false;
      this.hasSearched = true;
      this.bump++;
      this.saveLastSearch(); // persist for *this user on this browser*
    },

    tryLoadLastSearch() {
      if (!this.STORAGE_KEY) return;
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return;

        const p = JSON.parse(raw);
        if (!p?.query) return;

        this.lastSearch = {
          query: (p.query || "").trim(),
          cuisine: p.cuisine || "",
          diet: p.diet || "",
          intolerances: p.intolerances || "",
          number: [5, 10, 15].includes(+p.number) ? +p.number : 5,
          sortKey: p.sortKey || ""
        };
        this.useLast = true;     // show last results
        this.hasSearched = true; // activate endpoint
        this.bump++;             // trigger fetch
      } catch {
        // ignore corrupted storage
      }
    },

    saveLastSearch() {
      if (!this.STORAGE_KEY) return; // only when logged in
      try {
        localStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify({
            query: this.query.trim(),
            cuisine: this.cuisine,
            diet: this.diet,
            intolerances: this.intolerances,
            number: this.number,
            sortKey: this.sortKey,
            ts: Date.now()
          })
        );
      } catch {
        // storage disabled/full — ignore
      }
    }
  }
};
</script>

<style scoped>
.search-page { --card-radius: 16px; }
.hero { border-radius: var(--card-radius); }
.hero-input { padding-left: 1.1rem; border-radius: 12px; }
.card { border: 1px solid #eef0f3; border-radius: var(--card-radius); }
.form-label { font-weight: 600; }
.btn-primary { border-radius: 12px; font-weight: 600; letter-spacing: .02em; }
@media (max-width: 576px) { .hero { gap: .5rem; } }
</style>
