<!-- src/pages/CreateNewRecipe.vue -->
<template>
  <div class="container py-4">
    <h1 class="mb-3">Create a New Recipe</h1>

    <form @submit.prevent="onSubmit" class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Title *</label>
        <input v-model.trim="form.title" type="text" class="form-control" required />
      </div>

      <div class="col-md-6">
        <label class="form-label">Image URL</label>
        <input v-model.trim="form.image" type="url" class="form-control" placeholder="https://…" />
      </div>

      <div class="col-md-4">
        <label class="form-label">Ready in minutes *</label>
        <input v-model.number="form.readyInMinutes" type="number" min="1" class="form-control" required />
      </div>

      <div class="col-md-4">
        <label class="form-label">Servings</label>
        <input v-model.number="form.servings" type="number" min="1" class="form-control" />
      </div>

      <div class="col-md-4 d-flex align-items-end gap-3">
        <div class="form-check">
          <input v-model="form.vegetarian" class="form-check-input" type="checkbox" id="veg" />
          <label class="form-check-label" for="veg">Vegetarian</label>
        </div>
        <div class="form-check">
          <input v-model="form.vegan" class="form-check-input" type="checkbox" id="vegan" />
          <label class="form-check-label" for="vegan">Vegan</label>
        </div>
        <div class="form-check">
          <input v-model="form.glutenFree" class="form-check-input" type="checkbox" id="gf" />
          <label class="form-check-label" for="gf">GF</label>
        </div>
      </div>

      <div class="col-12">
        <label class="form-label">Ingredients (one per line) *</label>
        <textarea v-model="form.ingredients" class="form-control" rows="4"
                  placeholder="2 cups flour&#10;1 tsp salt" required></textarea>
      </div>

      <div class="col-12">
        <label class="form-label">Instructions (one per line) *</label>
        <textarea v-model="form.instructions" class="form-control" rows="5"
                  placeholder="Step 1…&#10;Step 2…" required></textarea>
      </div>

      <div class="col-12 d-flex gap-2">
        <button class="btn btn-primary" type="submit">Save</button>
        <router-link class="btn btn-outline-secondary" :to="{ name: 'main' }">Back to Home</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, getCurrentInstance } from 'vue'
import axiosFallback from 'axios'   // keep as fallback only

const internal = getCurrentInstance()
const gp      = internal.appContext.config.globalProperties

// ✅ use the same axios instance as the rest of the app
const axios   = gp?.axios || axiosFallback

const store   = gp.store
const toast   = gp.toast
const router  = gp.$router

const form = reactive({
  title: '', image: '', readyInMinutes: 0, servings: 1,
  vegetarian: false, vegan: false, glutenFree: false,
  ingredients: '', instructions: ''
})

function makeIntId() {
  return Math.floor(Math.random() * 1_900_000_000) + 100_000_000
}
function toExtendedIngredients(text) {
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(original => ({ original }))
}
function toAnalyzedInstructions(text) {
  const steps = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map((step, i) => ({ number: i + 1, step }))
  return [{ name: '', steps }]
}
function validate() {
  if (!form.title.trim()) return 'Title is required'
  if (!Number.isFinite(+form.readyInMinutes) || +form.readyInMinutes < 1) return 'Ready in minutes must be ≥ 1'
  if (!toExtendedIngredients(form.ingredients).length) return 'At least one ingredient is required'
  if (!toAnalyzedInstructions(form.instructions)[0].steps.length) return 'At least one instruction is required'
  return ''
}

async function onSubmit() {
  const err = validate()
  if (err) return void toast?.('Create Recipe', err, 'warning')

  const id = makeIntId()
  const payload = {
    id,
    title: form.title.trim(),
    image: form.image.trim() || null,
    readyInMinutes: +form.readyInMinutes,
    popularity: 0,
    vegetarian: !!form.vegetarian,
    vegan: !!form.vegan,
    glutenFree: !!form.glutenFree,
    extendedIngredients: toExtendedIngredients(form.ingredients),
    analyzedInstructions: toAnalyzedInstructions(form.instructions),
    servings: +form.servings || 1
  }

  try {
    // If your app’s axios has baseURL set, just call relative URL.
    // If you also keep server_domain in store, use it when present.
    const base = store?.server_domain || ''
    const url  = base ? "/users/createRecipe" : '/users/createRecipe'

    await axios.post(url, payload, { withCredentials: true })

    toast?.('Recipe', 'Recipe created successfully', 'success')
    router.push({ name: 'myRecipes' }).catch(() => {})
  } catch (e) {
    const msg = e?.response?.data?.message || e?.response?.data || e.message || 'Failed to create recipe'
    toast?.('Recipe', msg, 'danger')
  }
}
</script>


<style scoped>
.container { max-width: 900px; }
</style>
