// import { createApp } from 'vue';
// import App from './App.vue';
// import routes from './router/index';
// import axios from 'axios';
// import VueAxios from 'vue-axios';
// import { createRouter, createWebHistory } from 'vue-router';

// import 'bootstrap/dist/css/bootstrap.css';
// import 'bootstrap/dist/js/bootstrap.bundle.js';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // 👈 needed for dropdowns

// import BootstrapVue3 from 'bootstrap-vue-3';
// import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';

// import store from './store';



// const router = createRouter({
//   history: createWebHistory(),
//   routes
// });

// const app = createApp(App);


// app.use(router);
// app.use(VueAxios, axios);
// app.use(BootstrapVue3);


// axios.defaults.baseURL = store.server_domain;     // -> "http://localhost:3000"
// axios.defaults.withCredentials = true;  

// app.config.globalProperties.store = store;

// app.config.globalProperties.toast = function (title, content, variant = null, append = false) {
//   const toastContainerId = "toast-container";
//   let toastContainer = document.getElementById(toastContainerId);
//   if (!toastContainer) {
//     toastContainer = document.createElement("div");
//     toastContainer.id = toastContainerId;
//     toastContainer.style.position = "fixed";
//     toastContainer.style.top = "1rem";
//     toastContainer.style.right = "1rem";
//     toastContainer.style.zIndex = "1055";
//     document.body.appendChild(toastContainer);
//   }

//   const toast = document.createElement("div");
//   toast.className = `toast align-items-center text-bg-${variant || 'info'} border-0 show`;
//   toast.setAttribute("role", "alert");
//   toast.setAttribute("aria-live", "assertive");
//   toast.setAttribute("aria-atomic", "true");

//   toast.innerHTML = `
//     <div class="d-flex">
//       <div class="toast-body">
//         <strong>${title}</strong><br>${content}
//       </div>
//       <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
//     </div>
//   `;

//   if (!append) {
//     toastContainer.innerHTML = "";
//   }
//   toastContainer.appendChild(toast);

//   setTimeout(() => {
//     toast.remove();
//   }, 3000);
// };

// app.mount('#app');

// main.js (frontend entry)
import { createApp } from "vue";
import App from "./App.vue";
import routes from "./router";
import axios from "axios";
import VueAxios from "vue-axios";
import { createRouter, createWebHistory /* or createWebHashHistory */ } from "vue-router";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // bundle includes Popper (needed for dropdowns)

import BootstrapVue3 from "bootstrap-vue-3";
import "bootstrap-vue-3/dist/bootstrap-vue-3.css";

import store from "./store";

// ===== Router =====
// Prefer clean URLs; if you keep getting 404s on deep links, switch to createWebHashHistory()
const router = createRouter({
  history: createWebHistory("/"),
  routes,
});

// ===== Axios baseURL =====
// Use the proxy in production, direct localhost in dev

const isProdHost = location.hostname.endsWith("cs.bgu.ac.il");
// ✅ prod -> /api (through proxy); dev -> direct to backend
axios.defaults.baseURL = isProdHost ? "/api" : "http://127.0.0.1:3000";
axios.defaults.withCredentials = true;


// const isProdHost = location.hostname.endsWith("cs.bgu.ac.il");
// // prod = same-origin root, dev = direct to backend (no /api)
// axios.defaults.baseURL = isProdHost ? "/" : "http://127.0.0.1:3000";
// axios.defaults.withCredentials = true;


// ===== App =====
const app = createApp(App);
app.use(router);
app.use(VueAxios, axios);
app.use(BootstrapVue3);

// (optional) expose store
app.config.globalProperties.store = store;

// Simple toast helper (kept as-is)
app.config.globalProperties.toast = function (title, content, variant = null, append = false) {
  const toastContainerId = "toast-container";
  let toastContainer = document.getElementById(toastContainerId);
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = toastContainerId;
    toastContainer.style.position = "fixed";
    toastContainer.style.top = "1rem";
    toastContainer.style.right = "1rem";
    toastContainer.style.zIndex = "1055";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-bg-${variant || "info"} border-0 show`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <strong>${title}</strong><br>${content}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  if (!append) toastContainer.innerHTML = "";
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

app.mount("#app");
