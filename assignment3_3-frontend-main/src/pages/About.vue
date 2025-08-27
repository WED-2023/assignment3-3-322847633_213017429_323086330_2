<!-- src/pages/About.vue -->
<script setup>
// multi-word name keeps linters happy
defineOptions({ name: 'AboutPage' });

// Replace these with any real links you want
const personalSites = [
  { label: 'Personal Site – 322847633', href: 'https://wed-2023.github.io/322847633/' },
  { label: 'Personal Site – 213017429', href: 'https://wed-2023.github.io/213017429/' },
  { label: 'Personal Site – 323086330', href: 'https://wed-2023.github.io/assignment1-JAWADDAB/' }
];

const projects = [
  { label: 'Space Shooter Game (GitHub)', href: 'https://github.com/WED-2023/assignment2-322847633_213017429_323086330_2' }
];
</script>

<template>
  <div class="about container py-5">

    <!-- Hero / Intro -->
    <section class="card border-0 shadow-lg overflow-hidden mb-4 hero">
      <div class="hero-bg"></div>
      <div class="p-4 p-md-5 text-white position-relative">
        <h1 class="display-6 fw-semibold mb-2">Welcome to our Recipes Project 👋</h1>
        <p class="lead mb-0 opacity-90">
          We are three third-year Information Systems Engineering students.
          This project practices end-to-end delivery—database design, secure API development,
          and a responsive UI. We split work between frontend and backend and reviewed each
          other’s code to keep quality high.
        </p>
      </div>
    </section>

    <!-- Marketing blurb -->
    <section class="mb-5">
      <h2 class="section-title">What is this project?</h2>
      <p class="text-muted mb-4">
        Discover recipes the smart way—our full-stack app makes it effortless to explore,
        save, and revisit dishes you love. With a sleek Vue 3 interface, powerful search,
        and personalized features like favorites and last-viewed, it turns inspiration into
        dinner in just a few clicks. Backed by a secure Express + MySQL API, it’s fast,
        reliable, and designed for real-life cooking.
      </p>

      <div class="row g-4">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm subtle-border">
            <div class="card-body">
              <h5 class="card-title mb-3">Frontend</h5>
              <ul class="list-unstyled small mb-0">
                <li>• Vue 3 (Composition API) + Vue Router</li>
                <li>• Axios for HTTP & session cookies</li>
                <li>• Bootstrap 5 + BootstrapVue 3 components</li>
                <li>• Reusable UI: previews, lists, modals</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card h-100 shadow-sm subtle-border">
            <div class="card-body">
              <h5 class="card-title mb-3">Backend</h5>
              <ul class="list-unstyled small mb-0">
                <li>• Node.js + Express REST API</li>
                <li>• Sessions & Cookies for auth</li>
                <li>• MySQL for users, favorites, visited, recipes</li>
                <li>• Clear routing: <code>/users</code>, <code>/recipes</code>, <code>/auth</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Links -->
    <section class="mb-4">
      <h2 class="section-title">Personal Websites</h2>
      <div class="d-flex flex-wrap gap-2">
        <a
          v-for="(item, i) in personalSites"
          :key="'p-' + i"
          class="btn btn-outline-primary btn-sm"
          :href="item.href"
          target="_blank"
          rel="noopener"
        >
          {{ item.label }}
        </a>
      </div>
    </section>

    <section class="mb-2">
      <h2 class="section-title">Space Shooter Game</h2>
      <div class="d-flex flex-wrap gap-2">
        <a
          v-for="(item, i) in projects"
          :key="'g-' + i"
          class="btn btn-outline-success btn-sm"
          :href="item.href"
          target="_blank"
          rel="noopener"
        >
          {{ item.label }}
        </a>
      </div>
    </section>

    <router-link class="btn btn-secondary mt-4" :to="{ name: 'main' }">
      Back to Home
    </router-link>
  </div>
</template>

<style scoped>
.about { max-width: 980px; }

/* Hero gradient */
.hero .hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(900px 320px at -10% -20%, rgba(79,70,229,1) 0%, rgba(79,70,229,.3) 40%, transparent 70%),
    linear-gradient(135deg, #0ea5e9 0%, #6366f1 60%, #8b5cf6 100%);
  opacity: .9;
}

/* Minor cosmetics */
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: .5rem;
}
.opacity-90 { opacity: .9; }
.subtle-border { border: 1px solid rgba(0,0,0,.05); }
</style>
