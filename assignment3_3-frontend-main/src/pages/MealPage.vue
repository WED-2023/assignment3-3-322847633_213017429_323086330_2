<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h4 m-0">My Meal Plan</h1>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="reload" :disabled="loading">Reload</button>
        <button class="btn btn-outline-danger btn-sm" @click="clearAll" :disabled="loading || !items.length">Clear All</button>
      </div>
    </div>

    <div v-if="!items.length && !loading" class="alert alert-info">No meals added</div>
    <div v-if="loading" class="text-muted">Loading…</div>

    <ul class="list-group" v-if="items.length">
      <li v-for="(it, i) in items" :key="it.recipe_id"
          class="list-group-item d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <span class="badge bg-secondary">{{ i + 1 }}</span>
          <router-link :to="{ name: 'recipe', params:{ recipeId: it.recipe_id } }" class="fw-semibold">
            {{ it.title || ('Recipe #' + it.recipe_id) }}
          </router-link>

          <div class="w-100" style="max-width: 260px;">
            <div class="progress" style="height: 8px;">
              <div class="progress-bar"
                   role="progressbar"
                   :style="{ width: progressPercent(it.recipe_id) + '%' }"
                   :aria-valuenow="progressPercent(it.recipe_id)" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <small class="text-muted">{{ progressLabel(it.recipe_id) }}</small>
          </div>
        </div>

        <div class="btn-group">
          <button class="btn btn-outline-primary btn-sm" :disabled="i===0 || loading" @click="moveUp(i)">▲</button>
          <button class="btn btn-outline-primary btn-sm" :disabled="i===items.length-1 || loading" @click="moveDown(i)">▼</button>
          <button class="btn btn-outline-danger btn-sm" :disabled="loading" @click="removeOne(it.recipe_id)">Remove</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import axios from 'axios'

const inst = getCurrentInstance()
const gp = inst.appContext.config.globalProperties || {}
const store = gp.store
const toast = gp.$toast || gp.toast || ((title, msg) => window.alert(`${title}: ${msg}`))

const items = ref([])
const loading = ref(false)
const baseURL = store?.server_domain || ''   // '' = same origin
const username = store?.username || ''

// --- helpers for local title cache (avoid API cost)
const getCachedTitle = (id) => localStorage.getItem(`title:${id}`) || null
const setCachedTitle = (id, title) => localStorage.setItem(`title:${id}`, title)

// Fetch title for a recipe id (from your backend details endpoint)
async function fetchTitle(id) {
  try {
    const { data } = await axios.get(`${baseURL}/recipes/${id}`, { withCredentials: true })
    const t = data?.recipe?.title || data?.title || ''
    if (t) setCachedTitle(id, t)
    return t
  } catch {
    return ''
  }
}

// Fill in titles for items that don’t have one
async function hydrateTitles(list) {
  const pending = []
  for (const it of list) {
    if (!it.title) {
      const cached = getCachedTitle(it.recipe_id)
      if (cached) {
        it.title = cached
      } else {
        // stagger a bit to avoid bursts (optional)
        pending.push(
          fetchTitle(it.recipe_id).then(t => { if (t) it.title = t })
        )
      }
    }
  }
  if (pending.length) await Promise.all(pending)
}

const reload = async () => {
  loading.value = true
  try {
    const { data } = await axios.get(`/users/mealPlan`, { withCredentials: true })
    const list = (Array.isArray(data) ? data : []).sort(
      (a,b) => (a.order_number ?? 0) - (b.order_number ?? 0)
    )
    items.value = list
    if (store) store.mealCount = list.length

    // Important: fetch titles for nicer display
    await hydrateTitles(items.value)
  } catch (e) {
    const status = e?.response?.status
    if (status === 401) {
      toast('Meal Plan', 'Please log in to view your meal plan', 'danger')
    } else {
      toast('Meal Plan', e?.response?.data?.message || e.message, 'danger')
    }
    items.value = []
    if (store) store.mealCount = 0
  } finally { loading.value = false }
}

// Read progress saved by the Prepare page (it stores checked.step)
const progressData = (recipeId) => {
  if (!username) return { done: 0, total: 0 }
  try {
    const raw = localStorage.getItem(`prep:${username}:${recipeId}`)
    const obj = raw ? JSON.parse(raw) : null
    const stepMap = obj?.checked?.step || {}
    const done  = Object.values(stepMap).filter(Boolean).length || 0
    const total = Object.keys(stepMap).length || 0
    return { done, total }
  } catch { return { done: 0, total: 0 } }
}
const progressPercent = (id) => {
  const { done, total } = progressData(id)
  return total ? Math.round((done / total) * 100) : 0
}
const progressLabel = (id) => {
  const { done, total } = progressData(id)
  return `${done}/${total || 0}`
}

const removeOne = async (recipe_id) => {
  if (loading.value) return
  loading.value = true
  try {
    await axios.delete(`/users/mealPlan/${recipe_id}`, { withCredentials: true })
    toast('Meal Plan', 'Recipe removed', 'success')
    await reload()
  } catch (e) {
    toast('Meal Plan', e?.response?.data?.message || e.message, 'danger')
  } finally { loading.value = false }
}

const clearAll = async () => {
  if (!confirm('Clear all recipes from your meal plan?')) return
  loading.value = true
  try {
    await axios.delete(`/users/mealPlan`, { withCredentials: true })
    items.value = []
    if (store) store.mealCount = 0
    toast('Meal Plan', 'Meal plan cleared', 'success')
  } catch (e) {
    toast('Meal Plan', e?.response?.data?.message || e.message, 'danger')
  } finally { loading.value = false }
}

// Reorder (optional – if your PUT route is wired)
async function swap(i, j) {
  const a = items.value[i], b = items.value[j]
  if (!a || !b) return
  const oa = a.order_number, ob = b.order_number
  items.value[i] = b; items.value[j] = a
  items.value[i].order_number = oa; items.value[j].order_number = ob
  try {
    await axios.put(`/users/mealPlan`,
      { recipe_id: a.recipe_id, newOrder: ob },
      { withCredentials: true }
    )
    await axios.put(`/users/mealPlan`,
      { recipe_id: b.recipe_id, newOrder: oa },
      { withCredentials: true }
    )
  } catch {
    await reload()
    toast('Meal Plan', 'Reorder failed', 'danger')
  }
}
const moveUp = async (i) => { if (i > 0 && !loading.value) await swap(i, i - 1) }
const moveDown = async (i) => { if (i < items.value.length - 1 && !loading.value) await swap(i, i + 1) }

onMounted(reload)
</script>


<style scoped>
.container { max-width: 900px; }
</style>
