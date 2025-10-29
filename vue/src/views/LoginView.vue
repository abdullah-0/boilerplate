<template>
  <AuthCard :is-submitting="loading" title="Sign in" :on-submit="handleSubmit">
    <label>
      Email
      <input v-model="form.email" type="email" required />
    </label>
    <label>
      Password
      <input v-model="form.password" type="password" required />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="center">
      <RouterLink to="/forgot-password">Forgot password?</RouterLink>
    </p>
    <template #footer>
      <p class="center">
        Need an account?
        <RouterLink to="/register">Create one</RouterLink>
      </p>
    </template>
  </AuthCard>
</template>

<script setup lang="ts">
import { reactive, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";

import AuthCard from "@/components/AuthCard.vue";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

const router = useRouter();
const store = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});
const error = ref<string | null>(null);
const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await login(form);
    store.setAuth(data);
    await router.replace({ name: "dashboard" });
  } catch (err) {
    error.value = "Unable to sign in. Check your credentials.";
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
