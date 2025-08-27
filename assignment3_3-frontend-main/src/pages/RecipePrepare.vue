<template>
  <div class="container py-4" v-if="ready">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="m-0">Prepare: {{ title }}</h2>
      <div class="d-flex align-items-center gap-2">
        <span class="text-muted">Servings</span>
        <input v-model.number="target" type="number" min="1" class="form-control form-control-sm" style="width:90px">
        <div class="btn-group">
          <button class="btn btn-outline-secondary btn-sm" @click="setMul(1)">×1</button>
          <button class="btn btn-outline-secondary btn-sm" @click="setMul(2)">×2</button>
          <button class="btn btn-outline-secondary btn-sm" @click="setMul(3)">×3</button>
        </div>
        <button class="btn btn-outline-danger btn-sm" @click="reset">Reset</button>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-5">
        <div class="card h-100">
          <div class="card-header">
            <strong>Ingredients</strong>
            <small class="text-muted">(base {{ base }}, now {{ target }})</small>
          </div>
          <ul class="list-group list-group-flush">
            <li v-for="(ing,i) in scaled" :key="i" class="list-group-item d-flex align-items-start">
              <input class="form-check-input me-2 mt-1" type="checkbox"
                     :checked="checked.ing[i]||false" @change="toggle('ing',i,$event)">
              <div>
                <div class="fw-semibold">
                  {{ fmt(ing.amount) }} {{ ing.unit }} <span v-if="ing.unit && ing.name">·</span> {{ ing.name }}
                </div>
                <div v-if="ing.note" class="small text-muted">{{ ing.note }}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="col-lg-7">
        <div class="card h-100">
          <div class="card-header"><strong>Steps</strong></div>
          <ol class="list-group list-group-numbered">
            <li v-for="(s,i) in steps" :key="i" class="list-group-item d-flex gap-3">
              <input class="form-check-input mt-1" type="checkbox"
                     :checked="checked.step[i]||false" @change="toggle('step',i,$event)">
              <div class="flex-grow-1">{{ s.step }}</div>
            </li>
          </ol>
        </div>
      </div>

      <!-- The button -->
      <div class="col-12 mt-2">
        <button type="button"
                class="btn btn-primary w-100"
                @click="addToMeal"
                :disabled="adding">
          {{ adding ? 'Adding…' : 'Add this recipe to my meal plan' }}
        </button>
      </div>
    </div>
  </div>

  <div v-else class="container py-5 text-center text-muted">Loading…</div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'RecipePrepare',
  data() {
    return {
      id: this.$route.params.recipeId,
      title: '',
      base: 1,
      target: 1,
      ingredients: [],
      instructions: [],
      checked: { ing: {}, step: {} },
      ready: false,
      adding: false
    }
  },
  computed: {
    userKey() {
      const u = this.$root?.store?.username || ''
      return u ? `prep:${u}:${this.id}` : null
    },
    steps() {
      const blocks = Array.isArray(this.instructions) ? this.instructions : []
      return blocks.flatMap(b => (b.steps || [])).map(s => ({ step: s.step || String(s) }))
    },
    scaled() {
      const f = Math.max(1, this.target) / Math.max(1, this.base)
      return (this.ingredients || []).map(ing => {
        const amt = ing.measures?.us?.amount ?? ing.measures?.metric?.amount ?? ing.amount ?? 0
        const unit = ing.measures?.us?.unitShort ?? ing.measures?.metric?.unitShort ?? ing.unit ?? ''
        const name = ing.originalName || ing.name || ing.original || ''
        return { amount: amt * f, unit, name, note: ing.meta?.join(', ') || '' }
      })
    }
  },
  async created() {
    await this.fetchData()
    this.loadProgress()
  },
  watch: {
    target: 'saveProgress',
    checked: { handler: 'saveProgress', deep: true }
  },
  methods: {
    async fetchData() {
      try {
        const { data } = await axios.get(`/recipes/prepare/${this.id}`, { withCredentials: true })
        this.ingredients  = data.ingredients || []
        this.instructions = data.instructions || []
        this.base = data.servings || 1
        this.target = this.base
        try {
          const r = await axios.get(`/recipes/${this.id}`, { withCredentials: true })
          this.title = r.data?.recipe?.title || r.data?.title || ''
        } catch { /* ignore */ }
      } catch (e) {
        this.$root?.$toast?.('Prepare', e?.response?.data?.message || 'Failed to load', 'danger')
        console.error(e)
      } finally {
        // ensure UI shows even if fetch failed
        this.ready = true
      }
    },
    setMul(m) { this.target = Math.max(1, Math.round(this.base * m)) },
    // Vue 3: update nested state immutably (no this.$set)
    toggle(kind, idx, ev) {
      const next = { ...this.checked[kind], [idx]: !!ev.target.checked }
      this.checked = { ...this.checked, [kind]: next }
    },
    fmt(n) { return isNaN(n) ? '' : Math.round((n + Number.EPSILON) * 100) / 100 },
    loadProgress() {
      if (!this.userKey) return
      const obj = JSON.parse(localStorage.getItem(this.userKey))
      if (!obj) return
      this.target = obj.target ?? this.base
      this.checked = obj.checked || this.checked
    },
    saveProgress() {
      if (!this.userKey) return
      localStorage.setItem(this.userKey, JSON.stringify({ target: this.target, checked: this.checked }))
    },
    reset() {
      this.checked = { ing: {}, step: {} }
      this.target = this.base
      if (this.userKey) localStorage.removeItem(this.userKey)
    },
    async addToMeal () {
      if (this.adding) return
      this.adding = true
      try {
        await axios.post('/users/mealPlan',
          { recipeId: Number(this.id) || this.id },
          { withCredentials: true }
        )
        this.$root?.$toast?.('Meal Plan', 'Recipe added', 'success')
      } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to add'
        this.$root?.$toast?.('Meal Plan', msg, 'danger')
        if (e?.response?.status === 401) {
          this.$router.push({ name: 'login' }).catch(() => {})
        }
        console.error('addToMeal failed:', e)
      } finally {
        this.adding = false
      }
    }
  }
}
</script>

<style scoped>
.container { max-width: 1100px; }
.list-group-numbered > .list-group-item::marker { font-weight: 600; }
</style>
