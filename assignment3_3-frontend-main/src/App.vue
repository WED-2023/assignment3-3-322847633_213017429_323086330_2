<template>
  <div id="app">
    <!-- Top Nav -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div class="container">
        <!-- Brand -->
        <router-link class="navbar-brand fw-bold" :to="{ name: 'main' }">
          Home
        </router-link>

        <!-- Mobile toggle -->
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Collapsible content -->
        <div class="collapse navbar-collapse" id="mainNav">
          <!-- Left: tabs for everyone -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link class="nav-link" :to="{ name: 'search' }">Search</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" :to="{ name: 'about' }">About</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link d-flex align-items-center gap-1" :to="{ name: 'mealPlan' }">
                My Meal Plan
                <span v-if="store?.mealCount" class="badge bg-secondary">{{ store.mealCount }}</span>
              </router-link>
            </li>
          </ul>

          <!-- Right: guest vs logged-in -->
          <ul class="navbar-nav ms-auto align-items-lg-center">
            <!-- Guest -->
            <template v-if="!store?.username">
              <li class="nav-item me-lg-3 text-muted d-flex align-items-center">
                Hello Guest
              </li>
              <li class="nav-item">
                <router-link class="nav-link" :to="{ name: 'login' }">Login</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" :to="{ name: 'register' }">Register</router-link>
              </li>
            </template>

            <!-- Logged-in -->
            <template v-else>
              <li class="nav-item d-flex align-items-center me-lg-2 fw-semibold">
                {{ store.username }}
              </li>

              <!-- Personal area (dropdown with 3 items) -->
              <li class="nav-item dropdown">
                <a
                  id="userMenu"
                  class="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  @click.prevent="toggleUserMenu"
                >
                  My Account
                </a>

                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                  <li>
                    <router-link class="dropdown-item" :to="{ name: 'favorites' }" @click="closeDropdown">
                      Favorites Recipes
                    </router-link>
                  </li>
                  <li>
                    <router-link class="dropdown-item" :to="{ name: 'myRecipes' }" @click="closeDropdown">
                      My Recipes
                    </router-link>
                  </li>
                  <li>
                    <router-link class="dropdown-item" :to="{ name: 'family' }" @click="closeDropdown">
                      Family Recipes
                    </router-link>
                  </li>
                </ul>
              </li>

              <!-- Create new recipe (opens modal) -->
              <li class="nav-item ms-lg-2">
                <button class="nav-link btn btn-link p-0" type="button" @click="openCreate">
                  Create a new Recipe
                </button>
              </li>

              <!-- Logout -->
              <li class="nav-item ms-lg-2">
                <button class="btn btn-outline-danger btn-sm" @click="logout">
                  Logout
                </button>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Create Recipe modal -->
    <div v-if="showCreate" class="modal-backdrop fade show"></div>
    <div
      v-if="showCreate"
      class="modal d-block"
      tabindex="-1"
      role="dialog"
      @click.self="closeCreate"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create a new Recipe</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="closeCreate"></button>
          </div>
          <div class="modal-body">
            <CreateNewRecipe @close="closeCreate" />
          </div>
        </div>
      </div>
    </div>

    <!-- Page content -->
    <router-view />
  </div>
</template>

<script>
import { ref, getCurrentInstance, onMounted, watch, nextTick } from 'vue'
import { Dropdown } from 'bootstrap'                 // needs @popperjs/core installed
import CreateNewRecipe from '@/components/CreateNewRecipe.vue'

export default {
  name: 'App',
  components: { CreateNewRecipe },
  setup () {
    const internal = getCurrentInstance()
    const store   = internal.appContext.config.globalProperties.store
    const toast   = internal.appContext.config.globalProperties.toast
    const router  = internal.appContext.config.globalProperties.$router
    const axios   = internal.appContext.config.globalProperties.axios

    // ----- Dropdown wiring -----
    let dd = null
    const initDropdown = () => {
      const el = document.getElementById('userMenu')
      if (!el) return
      // reuse instance if exists, otherwise create
      dd = Dropdown.getInstance(el) || new Dropdown(el, { autoClose: true })
    }
    const toggleUserMenu = (e) => {
      e?.preventDefault?.()
      if (!dd) initDropdown()
      dd?.toggle()
    }
    const closeDropdown = () => dd?.hide()

    onMounted(() => {
      if (store?.username) {
        nextTick().then(initDropdown)
      }
    })
    // If user logs in after mount, initialize then
    watch(() => store?.username, async (val, oldVal) => {
      if (val && !oldVal) {
        await nextTick()
        initDropdown()
      }
    })

    // ----- Modal state -----
    const showCreate = ref(false)
    const openCreate = () => { showCreate.value = true; document.body.classList.add('modal-open') }
    const closeCreate = () => { showCreate.value = false; document.body.classList.remove('modal-open') }

    // ----- Logout -----
    const logout = async () => {
      try {
        if (store?.server_domain && axios) {
          await axios.post(`${store.server_domain}/logout`, {}, { withCredentials: true }).catch(() => {})
        }
      } finally {
        store.logout?.()
        toast?.('Logout', 'User logged out successfully', 'success')
        closeDropdown()
        router.push({ name: 'main' }).catch(() => {})
      }
    }

    return {
      store,
      // dropdown
      toggleUserMenu,
      closeDropdown,
      // modal
      showCreate,
      openCreate,
      closeCreate,
      // actions
      logout
    }
  }
}
</script>

<style lang="scss">
@import "@/scss/form-style.scss";

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

/* Active link highlighting */
.navbar .nav-link.router-link-active {
  font-weight: 600;
}

/* In case something overlays the menu (rare), force it above */
.dropdown-menu {
  z-index: 2000;
}

/* Prevent background scroll when modal is open */
body.modal-open {
  overflow: hidden;
}
</style>
