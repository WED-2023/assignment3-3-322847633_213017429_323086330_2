<template>
  <div class="container py-4">
    <h1 class="mb-3">Family Recipes</h1>

    <button class="btn btn-success mb-3" @click="openCreate">
      + Add Family Recipe
    </button>

    <RecipePreviewList ref="list" title="Family Recipes" endpoint="/users/family" />

    <router-link class="btn btn-primary mt-3" :to="{ name: 'main' }">
      Back to Home
    </router-link>
  </div>

  <!-- Modal -->
  <div class="modal fade" ref="modalEl" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <form @submit.prevent="onSubmit">
          <div class="modal-header">
            <h5 class="modal-title">Create Family Recipe</h5>
            <button type="button" class="btn-close" @click="hide"></button>
          </div>

          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Title *</label>
                <input v-model.trim="form.title" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Image URL</label>
                <input v-model.trim="form.image" type="url" class="form-control" placeholder="https://…" />
              </div>

              <div class="col-md-4">
                <label class="form-label">Preparation time (min) *</label>
                <input v-model.number="form.preparationTime" type="number" min="1" class="form-control" required />
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
                          placeholder="2 cups flour&#10;1 tsp salt"></textarea>
              </div>

              <div class="col-12">
                <label class="form-label">Instructions (one per line) *</label>
                <textarea v-model="form.instructions" class="form-control" rows="5"
                          placeholder="Step 1…&#10;Step 2…"></textarea>
              </div>

              <div class="text-danger small" v-if="error">{{ error }}</div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" :disabled="loading" @click="hide">Cancel</button>
            <button type="submit" class="btn btn-success" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
              Save Family Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import RecipePreviewList from "@/components/RecipePreviewList.vue"
import { Modal } from "bootstrap"
import axios from "axios"             // ✅ add this

export default {
  name: "FamilyPage",
  components: { RecipePreviewList },
  data() {
    return {
      loading: false,
      error: "",
      form: this.emptyForm(),
      modal: null
    }
  },
  methods: {
    emptyForm() {
      return {
        title: "",
        image: "",
        preparationTime: 0,
        servings: 1,
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        ingredients: "",
        instructions: ""
      }
    },
    openCreate() {
      if (!this.$root?.store?.username) {
        this.$root?.toast?.("Auth", "Please login to add family recipes", "info")
        this.$router.push({ name: "login", query: { next: this.$route.fullPath } })
        return
      }
      this.error = ""
      this.form = this.emptyForm()
      this.show()
    },
    show() { this.modal?.show() },
    hide() { this.modal?.hide() },
    validate() {
      if (!this.form.title.trim()) return "Title is required"
      if (!Number.isFinite(+this.form.preparationTime) || +this.form.preparationTime < 1)
        return "Preparation time must be a positive number"
      const ing = this.form.ingredients.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      const ins = this.form.instructions.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      if (!ing.length) return "At least one ingredient is required"
      if (!ins.length) return "At least one instruction is required"
      return ""
    },
    async onSubmit() {
      const v = this.validate()
      if (v) { this.error = v; this.$root?.toast?.("Family", v, "warning"); return }

      const payload = {
        title: this.form.title.trim(),
        image: this.form.image.trim() || undefined,
        preparationTime: +this.form.preparationTime,
        ingrediants: this.form.ingredients
          .split(/\r?\n/).map(s => s.trim()).filter(Boolean),
        instructions: this.form.instructions
          .split(/\r?\n/).map(s => s.trim()).filter(Boolean),
        recipe_owner_id: this.$root?.store?.username,
        family_prep_time: this.form.preparationTime
      }

      try {
        this.loading = true
        const base = this.$root?.store?.server_domain || ""
        await axios.post(`${base}/users/family`, payload, { withCredentials: true }) // ✅ backticks + axios
        this.$root?.toast?.("Family", "Family recipe created", "success")
        this.hide()
        this.$refs.list?.updateRecipes?.()
      } catch (e) {
        this.error = e?.response?.data?.message || e.message || "Failed to create family recipe"
        this.$root?.toast?.("Family", this.error, "danger")
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.modal = new Modal(this.$refs.modalEl, { backdrop: "static" })
  }
}
</script>

<style scoped>
.modal-dialog { max-width: 900px; }
.modal-body   { max-height: 70vh; overflow: auto; }
.modal-footer {
  position: sticky;
  bottom: 0;
  background: #fff;
  z-index: 1;
}
</style>
