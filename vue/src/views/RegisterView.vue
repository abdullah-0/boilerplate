<template>
  <AuthCard :is-submitting="loading" title="Create account" :on-submit="handleSubmit">
    <label>
      First name
      <input v-model="form.first_name" required />
    </label>
    <label>
      Last name
      <input v-model="form.last_name" />
    </label>
    <label>
      Email
      <input v-model="form.email" type="email" required />
    </label>
    <label>
      Password
      <input v-model="form.password" type="password" minlength="8" required />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="success">{{ message }}</p>
    <template #footer>
      <p class="center">
        Already have an account?
        <RouterLink to="/login">Sign in</RouterLink>
      </p>
    </template>
  </AuthCard>
</template>

<script setup lang="ts">
import { reactive, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";

import AuthCard from "@/components/AuthCard.vue";
import { register } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

const router = useRouter();
const store = useAuthStore();

const form = reactive({
  first_name: "",
  last_name: "",
  email: "",
  password: "",
});
const message = ref<string | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  message.value = null;
  error.value = null;
  try {
    await register(form);
    message.value = "Account created. Check your email to verify.";
  } catch (err) {
    error.value = "Could not create account. Email may already exist.";
  } finally {
    loading.value = false;
  }
};

watchEffect(() => {
  if (!store.isLoading && store.user) {
    router.replace({ name: "dashboard" });
  }
});
</script>
