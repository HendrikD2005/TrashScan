<template>
  <v-btn
    :color="variant === 'primary' ? '#00c853' : 'white'"
    :prepend-icon="icon"
    :rounded="variant === 'primary' ? 'pill' : undefined"
    :size="variant === 'primary' ? 'large' : 'default'"
    :variant="variant === 'primary' ? 'flat' : 'text'"
    @click="$emit('click')"
  >
    {{ text }}
  </v-btn>
</template>

<script setup lang="ts">
  interface Props {
    icon?: string
    text: string
    variant?: 'default' | 'primary'
  }

  withDefaults(defineProps<Props>(), {
    variant: 'default',
  })

  defineEmits<{
    click: []
  }>()
</script>
