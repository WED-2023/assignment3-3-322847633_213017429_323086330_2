<template>
  <div class="login-page">
    <h1>Login</h1>
    <form @submit.prevent="login">
      <div class="form-group">
        <label>Username:</label>
        <input v-model="state.username" type="text" class="form-control" placeholder="Enter username" />
        <div v-if="v$.username.$error" class="text-danger">Username is required.</div>
      </div>

      <div class="form-group">
        <label>Password:</label>
        <input v-model="state.password" type="password" class="form-control" placeholder="Enter password" />
        <div v-if="v$.password.$error" class="text-danger">Password is required (at least 6 characters).</div>
      </div>

      <button type="submit" class="btn btn-primary mt-3">Login</button>

      <div class="text-center mt-3">
        <span class="text-muted">Don’t have an account?</span>
        <router-link :to="{ name: 'register' }" class="btn btn-outline-secondary ms-2 register-btn">
          Register
        </router-link>
      </div>

      <BAlert v-model="showSubmitError" variant="danger" dismissible class="mt-3">
        {{ submitError }}
      </BAlert>
    </form>
  </div>
</template>

<script>
import { reactive, ref, getCurrentInstance } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, minLength } from "@vuelidate/validators";
import axios from "axios";
import { useRouter } from "vue-router";

export default {
  name: "LoginPage",
  setup() {
    const state = reactive({ username: "", password: "" });
    const rules = { username: { required }, password: { required, minLength: minLength(6) } };
    const v$ = useVuelidate(rules, state);

    const submitError = ref("");
    const showSubmitError = ref(false);
    const loading = ref(false);

    const router = useRouter();

    // ✅ get the global store (like you did in MainPage.vue)
    const inst = getCurrentInstance();
    const store = inst.appContext.config.globalProperties.store;

  ///  const API = "http://localhost:3000";
  //  const API= "http://aseel-bin.cs.bgu.ac.il"

    const login = async () => {
      submitError.value = "";
      showSubmitError.value = false;

      const ok = await v$.value.$validate();
      if (!ok) {
        submitError.value = "Please fill username and password (min 6 chars).";
        showSubmitError.value = true;
        window.toast?.("Validation", submitError.value, "danger");
        return;
      }

      loading.value = true;
      try {
        // const resp = await axios.post(
        //   `${API}/login`,                                   // 👈 lowercase
        //   { username: state.username, password: state.password },
        //   { withCredentials: true }
        // );
        const resp = await axios.post(
          "/login",
          { username: state.username, password: state.password }
        );
        console.log("[Login] success:", { status: resp?.status, data: resp?.data });

        // ✅ use the real store, not window.store
        store.login(state.username);

        // ✅ navigate by route name you defined in router ("/")
        router.push({ name: "main" });
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Username or password is incorrect.";
        console.error("[Login] error:", err);
        submitError.value = msg;
        showSubmitError.value = true;
        window.toast?.("Login failed", msg, "danger");
      } finally {
        loading.value = false;
      }
    };

    return { state, v$, login, submitError, showSubmitError, loading };
  },
};
</script>

<style lang="scss" scoped>
.login-page { width: 100%; max-width: 400px; margin: 0 auto; padding: 40px; color: #556B2F; }
.login-page > h1 { text-align: center; margin-bottom: 20px; }
.form-group { margin-bottom: 20px; }
.text-danger { color: #d9534f; margin-top: 6px; }
.form-control { border-radius: 8px; }
.btn.btn-primary.mt-3 { display: block; width: 100%; }
.text-center { text-align: center; }
:deep(.alert) { margin-top: 20px; }
</style>
