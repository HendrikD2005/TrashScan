<template>
  <v-btn
    class="animated-btn"
    :color="variant === 'primary' ? '#00c853' : 'white'"
    :rounded="variant === 'primary' ? 'pill' : undefined"
    :size="variant === 'primary' ? 'large' : 'default'"
    :style="{ color: textColor }"
    :variant="variant === 'primary' ? 'flat' : 'text'"
    @click="$emit('click')"
  >
    {{ text }}
  </v-btn>
</template>

<script setup lang="ts">
  interface Props {
    text: string
    variant?: 'default' | 'primary'
    textColor?: string
  }

  withDefaults(defineProps<Props>(), {
    variant: 'default',
    textColor: 'white',
  })

  defineEmits<{
    click: []
  }>()
</script>

<style scoped>
.animated-btn {
  transition: transform 0.2s ease;
}

.animated-btn:hover {
  transform: translateY(-4px);
}

.animated-btn:active {
  transform: translateY(2px);
  transition: transform 0.1s ease;
}
</style>
