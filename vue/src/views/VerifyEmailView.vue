<template>
  <main class="page">
    <div class="card">
      <h1>Email verification</h1>
      <p class="center">{{ status }}</p>
      <button class="secondary" type="button" @click="handleResend">Resend email</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { resendVerification, verifyEmail } from "@/api/auth";

const status = ref("Verifying your email...");
const route = useRoute();

onMounted(async () => {
  const token = route.query.token as string | undefined;
  if (!token) {
    status.value = "Token missing. Request a new verification email.";
    return;
  }
  try {
    await verifyEmail(token);
    status.value = "Email verified. You may close this tab.";
  } catch (err) {
    status.value = "Verification failed. Request a new email.";
  }
});

const handleResend = async () => {
  const email = window.prompt("Enter your email to resend the verification link:");
  if (!email) {
    return;
  }
  await resendVerification(email);
  status.value = "Verification email sent.";
};
</script>
