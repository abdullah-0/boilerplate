<template>
  <AuthCard :is-submitting="loading" title="Password reset" :on-submit="handleSubmit">
    <label>
      Email
      <input v-model="email" type="email" required />
    </label>
    <p v-if="message" class="center">{{ message }}</p>
  </AuthCard>
</template>

<script setup lang="ts">
import { ref } from "vue";

import AuthCard from "@/components/AuthCard.vue";
import { forgotPassword } from "@/api/auth";

const email = ref("");
const message = ref<string | null>(null);
const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  message.value = null;
  try {
    await forgotPassword(email.value);
    message.value = "If an account exists for that email, a reset link has been sent.";
  } finally {
    loading.value = false;
  }
};
</script>
