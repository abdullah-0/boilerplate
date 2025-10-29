<template>
  <main class="page">
    <div class="card">
      <h1>Welcome back</h1>
      <p class="center">{{ auth.user?.email }}</p>
      <button class="secondary" type="button" @click="handleLogout">Sign out</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import { useAuthStore } from "@/store/auth";

const auth = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  auth.clear();
  await router.replace({ name: "login" });
};
</script>
