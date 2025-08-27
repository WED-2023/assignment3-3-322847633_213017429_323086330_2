<template>
  <div class="container recipe-page" v-if="recipe">
    <!-- Header -->
    <h1 class="title">{{ recipe.title }}</h1>

    <img v-if="recipe.image" :src="recipe.image" :alt="recipe.title" class="hero-img" />

    <!-- Meta row / preview details -->
    <div class="meta">
      <span v-if="recipe.readyInMinutes" class="chip">⏱ {{ recipe.readyInMinutes }} min</span>
      <span v-if="recipe.servings" class="chip">🍽 {{ recipe.servings }} servings</span>
      <span v-if="recipe.aggregateLikes" class="chip">👍 {{ recipe.aggregateLikes }}</span>

      <span v-if="recipe.glutenFree" class="chip chip--warn">GF</span>
      <span v-if="recipe.vegan" class="chip chip--ok">Vegan</span>
      <span v-else-if="recipe.vegetarian" class="chip chip--ok">Vegetarian</span>
      <span v-if="recipe.dairyFree" class="chip chip--ok">Dairy-free</span>
      <span v-if="recipe.veryHealthy" class="chip chip--ok">Healthy</span>
    </div>

    <!-- Optional summary -->
    <div v-if="recipe.summary" class="summary" v-html="recipe.summary"></div>

    <!-- Two-column body -->
    <div class="grid">
      <!-- Ingredients -->
      <section>
        <h2>Ingredients</h2>
        <ul class="ingredients">
          <li v-for="(ing, i) in recipe.extendedIngredients" :key="i + '_' + (ing.id ?? i)">
            <span v-if="formatIngredient(ing)">{{ formatIngredient(ing) }}</span>
            <span v-else>{{ ing.original || ing.originalName || ing.name }}</span>
          </li>
        </ul>
      </section>

      <!-- Instructions -->
      <section>
        <h2>Instructions</h2>

        <!-- Structured blocks (analyzedInstructions) -->
        <template v-if="hasBlocks">
          <div v-for="(block, bi) in recipe.analyzedInstructions" :key="'b'+bi" class="inst-block">
            <h3 v-if="block.name" class="inst-title">{{ block.name }}</h3>
            <ol>
              <li v-for="(s, si) in (block.steps || [])" :key="'s'+si">{{ s.step }}</li>
            </ol>
          </div>
        </template>

        <!-- Flat list fallback -->
        <ol v-else>
          <li v-for="(s, i) in recipe._instructions" :key="s.number || i">{{ s.step }}</li>
        </ol>
      </section>
      <router-link
        class="btn btn-success"
        :to="{ name: 'prepare', params: { recipeId: recipeId }, query: { source: source } }">
         Recipe Preparation
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "RecipeViewPage",
  data() {
    return { recipe: null,
             isWatched: false
     };
  },
  computed: {
    hasBlocks() {
      return Array.isArray(this.recipe?.analyzedInstructions) &&
             this.recipe.analyzedInstructions.some(b => Array.isArray(b?.steps) && b.steps.length);
    }
  },
  methods: {
    fmtAmt(n) {
      if (typeof n !== "number") return n;
      const fixed = n.toFixed(2);
      return fixed.endsWith(".00") ? String(Math.round(n)) : fixed.replace(/0+$/, "").replace(/\.$/, "");
    },
    formatIngredient(ing) {
      const m = ing?.measures?.metric || ing?.measures?.us;
      const amount = m?.amount;
      const unit = m?.unitShort || m?.unitLong || "";
      const name = ing?.name || ing?.originalName;
      if (amount && name) {
        const display = `${this.fmtAmt(amount)} ${unit}`.trim();
        return `${display} ${name}`.trim();
      }
      return ing?.original || null;
    }
  },
  async created() {
    const id = this.$route.params.recipeId;
    if (!id) return this.$router.replace({ name: "notFound" });

    try {
      // ✅ use the app axios (inherits baseURL + withCredentials)
      const resp = await this.axios.get(`/recipes/allInformations/${encodeURIComponent(id)}`);
      const r = resp?.data?.recipe ?? resp?.data ?? null;
      if (resp.status !== 200 || !r || !r.title) throw new Error("not found");

      const analyzed = Array.isArray(r.analyzedInstructions) ? r.analyzedInstructions : [];
      const flat = analyzed
        .map(b => Array.isArray(b.steps) ? b.steps : [])
        .flat()
        .map((s, i) => ({ number: s.number ?? i + 1, step: s.step }));

      this.recipe = {
        id: r.id,
        title: r.title,
        image: r.image,
        readyInMinutes: r.readyInMinutes,
        aggregateLikes: r.aggregateLikes,
        servings: r.servings,
        glutenFree: r.glutenFree,
        vegan: r.vegan,
        vegetarian: r.vegetarian,
        dairyFree: r.dairyFree,
        veryHealthy: r.veryHealthy,
        summary: r.summary,
        extendedIngredients: Array.isArray(r.extendedIngredients) ? r.extendedIngredients : [],
        analyzedInstructions: analyzed,
        instructions: r.instructions,
        _instructions: flat.length
          ? flat
          : (typeof r.instructions === "string"
              ? r.instructions
                  .split(/(?<=\.)\s+|[\n•-]+/)
                  .map(s => s.trim())
                  .filter(Boolean)
                  .map((s, i) => ({ number: i + 1, step: s }))
              : [])
      };
      this.isWatched= r.isWatched

      // ✅ record “visited” (let server 401 if not authed; we ignore errors)
   //   const rid = /^\d+$/.test(String(id)) ? Number(id) : String(id);
      this.axios.post(`/users/visited`, { recipeId: this.recipe.id }, {withCredentials: true}).catch(() => {});
    } catch (err) {
      console.error("[RecipeView] fetch error:", err?.response?.status, err?.response?.data || err?.message);
      this.$router.replace({ name: "notFound" });
    }
  }
};
</script>


<style scoped>
.recipe-page { max-width: 980px; margin: 0 auto; }
.title { font-size: 2.6rem; margin: 18px 0 10px; }
.hero-img { width: 100%; max-height: 460px; object-fit: cover; border-radius: 8px; }

.meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 18px; }
.chip { background: #f1f3f5; border-radius: 999px; padding: 4px 10px; font-size: 0.95rem; }
.chip--ok { background: #e6f7ed; color: #0d7a4e; }
.chip--warn { background: #fff4cf; color: #996c00; }

.summary { background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; }

.grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
@media (min-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }

h2 { font-size: 1.3rem; margin-bottom: 10px; }
.ingredients { padding-left: 18px; }
.inst-block { margin-bottom: 16px; }
.inst-title { font-size: 1.05rem; margin: 8px 0; color: #395; }
</style>
