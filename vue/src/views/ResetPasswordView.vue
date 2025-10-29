<template>
  <AuthCard :is-submitting="loading" title="Choose a new password" :on-submit="handleSubmit">
    <label>
      Token
      <input v-model="token" required />
    </label>
    <label>
      New password
      <input v-model="password" type="password" minlength="8" required />
    </label>
    <p v-if="status" class="success">{{ status }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </AuthCard>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

import AuthCard from "@/components/AuthCard.vue";
import { resetPassword } from "@/api/auth";

const route = useRoute();
const token = ref<string>((route.query.token as string) ?? "");
const password = ref("");
const status = ref<string | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);

watch(
  () => route.query.token,
  (value) => {
    if (typeof value === "string") {
      token.value = value;
    }
  }
);

const handleSubmit = async () => {
  loading.value = true;
  status.value = null;
  error.value = null;
  try {
    await resetPassword({ token: token.value, password: password.value });
    status.value = "Password updated successfully.";
  } catch (err) {
    error.value = "Unable to reset password. Request a new email.";
  } finally {
    loading.value = false;
  }
};
</script>
