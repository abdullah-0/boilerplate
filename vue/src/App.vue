<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

import { useAuthStore } from "@/store/auth";

const auth = useAuthStore();

const logoutListener = () => auth.clear();

onMounted(() => {
  void auth.hydrate();
  window.addEventListener("auth:logout", logoutListener);
});

onUnmounted(() => {
  window.removeEventListener("auth:logout", logoutListener);
});
</script>
