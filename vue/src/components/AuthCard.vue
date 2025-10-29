<template>
  <main class="page">
    <div class="card">
      <h1>{{ title }}</h1>
      <form class="stack" @submit.prevent="onSubmit">
        <slot />
        <button class="primary" type="submit" :disabled="isSubmitting">
          <slot name="cta">{{ isSubmitting ? 'Please wait...' : title }}</slot>
        </button>
      </form>
      <slot name="footer" />
    </div>
  </main>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  isSubmitting?: boolean;
  onSubmit: () => void | Promise<void>;
}

const props = defineProps<Props>();
const emit = defineEmits<{ submit: [] }>();

const onSubmit = async () => {
  emit("submit");
  await props.onSubmit?.();
};
</script>
