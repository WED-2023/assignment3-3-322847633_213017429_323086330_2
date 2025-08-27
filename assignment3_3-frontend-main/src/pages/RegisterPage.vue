<template>
  <div class="register-page">
    <h1>Register</h1>

    <form @submit.prevent="register" @reset.prevent="onReset" novalidate>
      <div class="form-group">
        <!-- Username -->
        <b-form-group label="Username" label-for="username">
          <b-form-input
            id="username"
            v-model="$v.form.username.$model"
            type="text"
            :state="validateState('username')"
            placeholder="Enter username"
            autocomplete="username"
          />
          <!-- show first rule message -->
          <b-form-invalid-feedback
            v-if="$v.form.username.$dirty && $v.form.username.$error">
            {{ firstError('username') }}
          </b-form-invalid-feedback>
          <!-- optional: taken on server -->
          <b-form-invalid-feedback v-else-if="usernameTaken">
            This username already exists. Please choose another.
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- First name -->
        <b-form-group label="First name" label-for="firstName">
          <b-form-input
            id="firstName"
            v-model="$v.form.firstName.$model"
            type="text"
            :state="validateState('firstName')"
            placeholder="Enter first name"
            autocomplete="given-name"
          />
          <b-form-invalid-feedback
            v-if="$v.form.firstName.$dirty && $v.form.firstName.$error">
            {{ firstError('firstName') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- Last name -->
        <b-form-group label="Last name" label-for="lastName">
          <b-form-input
            id="lastName"
            v-model="$v.form.lastName.$model"
            type="text"
            :state="validateState('lastName')"
            placeholder="Enter last name"
            autocomplete="family-name"
          />
          <b-form-invalid-feedback
            v-if="$v.form.lastName.$dirty && $v.form.lastName.$error">
            {{ firstError('lastName') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- Country -->
        <b-form-group label="Country" label-for="country">
          <b-form-select
            id="country"
            v-model="$v.form.country.$model"
            :options="countries"
            :state="validateState('country')"
          />
          <b-form-invalid-feedback
            v-if="$v.form.country.$dirty && $v.form.country.$error">
            {{ firstError('country') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- Email -->
        <b-form-group label="Email" label-for="email">
          <b-form-input
            id="email"
            v-model="$v.form.email.$model"
            type="email"
            :state="validateState('email')"
            placeholder="Enter email"
            autocomplete="email"
          />
          <b-form-invalid-feedback
            v-if="$v.form.email.$dirty && $v.form.email.$error">
            {{ firstError('email') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- Password -->
        <b-form-group label="Password" label-for="password">
          <b-form-input
            id="password"
            v-model.trim="$v.form.password.$model"
            type="password"
            :state="validateState('password')"
            placeholder="Enter password"
            autocomplete="new-password"
          />
          <b-form-invalid-feedback
            v-if="$v.form.password.$dirty && $v.form.password.$error">
            {{ firstError('password') }}
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- Confirm password -->
        <b-form-group label="Confirm password" label-for="confirmedPassword">
          <b-form-input
            id="confirmedPassword"
            v-model.trim="$v.form.confirmedPassword.$model"
            type="password"
            :state="validateState('confirmedPassword')"
            placeholder="Confirm password"
            autocomplete="new-password"
          />
          <b-form-invalid-feedback
            v-if="$v.form.confirmedPassword.$dirty && $v.form.confirmedPassword.$error">
            {{ firstError('confirmedPassword') }}
          </b-form-invalid-feedback>
        </b-form-group>
      </div>

      <!-- Actions -->
      <div class="d-flex gap-2 mt-3">
        <b-button type="submit" variant="success">Register</b-button>
        <b-button type="reset" variant="outline-secondary">Reset</b-button>
      </div>
      <div class="mt-2">
        <b style="color: #556B2F;">You have an account already?</b>
        <router-link to="login"> Log in here</router-link>
      </div>
    </form>
  </div>
</template>

<script>
import { reactive, ref, computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import { required, alpha, email as emailRule, sameAs, helpers } from '@vuelidate/validators'
import countryList from '../assets/countries.js'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'RegisterPage',
  
  setup () {
    const router = useRouter();   
   // const API = 'http://localhost:3000'
   // const API = "http://aseel-bin.cs.bgu.ac.il"

    const form = reactive({
      username: '',
      firstName: '',
      lastName: '',
      country: '',
      email: '',
      password: '',
      confirmedPassword: ''
    })

    // helper to create "required" with a custom message
    const req = (msg) => helpers.withMessage(msg, required)

    // validators with messages
    const usernameLen   = helpers.withMessage(
      'Username length should be between 3–8 characters',
      v => !!v && v.length >= 3 && v.length <= 8
    )
    const usernameAlpha = helpers.withMessage(
      'Username must contain letters only', alpha
    )

    const firstNameAlpha = helpers.withMessage('First name must contain letters only', alpha)
    const lastNameAlpha  = helpers.withMessage('Last name must contain letters only', alpha)

    const emailValid     = helpers.withMessage('Please enter a valid email address', emailRule)

    const strongPassword = helpers.withMessage(
      'Must be 5–10 characters with at least one number and one special character',
      v => /^(?=.*\d)(?=.*[^A-Za-z0-9]).{5,10}$/.test(v || '')
    )

    const passwordValue = computed(() => form.password)

    const sameAsPwd = helpers.withMessage(
      'Passwords must match the original password',
      sameAs(passwordValue)
    )

    const rules = {
      form: {
        username: { required: req('Username is required'), length: usernameLen, alpha: usernameAlpha },
        firstName:{ required: req('First name is required'), alpha: firstNameAlpha },
        lastName: { required: req('Last name is required'),  alpha: lastNameAlpha  },
        country:  { required: req('Country is required') },
        email:    { required: req('Email is required'), email: emailValid },
        password: { required: req('Password is required'), strong: strongPassword },
        confirmedPassword: { required: req('Confirmation is required'), sameAsPassword: sameAsPwd }
      }
    }

    const $v = useVuelidate(rules, { form })

    // select options (strings are OK for <b-form-select>)
    const countries = ref([...countryList].sort((a, b) => a.localeCompare(b)))

    // optional “username already exists”
    const usernameTaken = ref(false)

    // true/false/null for Bootstrap state
    const validateState = (field) => {
      const f = $v.value.form[field]
      return f.$dirty ? !f.$invalid : null
    }

    // returns the first rule message for FIELD
    const firstError = (field) => {
      const errs = $v.value.form[field].$errors
      return errs.length ? errs[0].$message : ''
    }

    const register = async () => {
      const ok = await $v.value.$validate()
      if (!ok) {
        window.toast?.('Validation', 'Please complete all fields correctly.', 'danger')
        return
      }
      if (usernameTaken.value) {
        window.toast?.('Registration', 'This username already exists. Choose another.', 'danger')
        return
      }

      try {
        const resp = await axios.post("/Register",
          {
            username:  form.username,
            firstname: form.firstName,
            lastname:  form.lastName,
            country:   form.country,
            password:  form.password,
            email:     form.email
          },
          { withCredentials: true }
        )
        console.log('[Register] success:', { status: resp?.status, data: resp?.data })

        window.toast?.('Registration Successful', 'You can now login', 'success')

        // ✅ go to login page after success
        router.push('/Login')
        // router.push({ name: 'login' });
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Registration failed.'
        console.error('[Register] error:', { status: err?.response?.status, data: err?.response?.data, err })
        window.toast?.('Registration failed', msg, 'danger')
      }
    }

    const onReset = () => {
      form.username = ''
      form.firstName = ''
      form.lastName = ''
      form.country = ''
      form.email = ''
      form.password = ''
      form.confirmedPassword = ''
      usernameTaken.value = false
      $v.value.$reset()
    }

    return {
      form, $v,
      register, onReset,
      validateState, firstError,
      countries, usernameTaken
    }
  }
}
</script>

<!-- 
<script>
import { reactive } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength, sameAs, maxLength, alpha, email } from '@vuelidate/validators';

export default {
  name: "RegisterPage",
  setup(_, { expose }) {
    const state = reactive({
      username: '',
      password: '',
      confirmPassword: '',
    });

    const rules = {
      username: { required },
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAsPassword: sameAs(() => state.password) }
    };

    const v$ = useVuelidate(rules, state);

    const register = async () => {
      if (await v$.value.$validate()) {
        try {
          await window.axios.post('/register', {
            username: state.username,
            password: state.password
          });
          window.toast("Registration Successful", "You can now login", "success");
          window.router.push('/login');
        } catch (err) {
          window.toast("Registration failed", err.response.data.message, "danger");
        }
      }
    };

    expose({ register });

    return { state, v$, register };
  }
};
</script> -->

<!-- <style scoped>
.register-page {
  max-width: 400px;
  margin: auto;
}
</style> -->


<style scoped lang="scss">
.register-page {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 40px 24px;
  color: #556B2F;
}
.register-page > h1 {
  text-align: center;
  font-size: 44px;
  font-weight: 600;
  margin: 10px 0 24px;
}
.form-group { margin-bottom: 18px; }
.form-control { height: 44px; border-radius: 10px; }
.invalid-feedback, .text-danger { color: #d9534f; margin-top: 6px; }
.mt-3 { margin-top: 15px; }
.btn { border-radius: 10px; }
.form-control::placeholder { color: #9aa0a6; opacity: 1; }
</style>
