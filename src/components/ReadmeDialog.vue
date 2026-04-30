<template>
    <v-dialog v-model="isOpen" persistent max-width="500">
        <v-card>
            <v-card-title class="text-center text-h5 font-weight-bold">
                Please Read!
            </v-card-title>

            <v-card-text class="text-center py-6">
                <p>
                    This project is a Proof of Concept (Poc) and is not intended for production use. No data is
                    collected or stored.
                </p>
            </v-card-text>

            <v-card-actions class="justify-end gap-2 pa-4">

                <v-btn color="primary" variant="flat" @click="handleOk">
                    OK
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const isOpen = ref(false)

onMounted(() => {
    isOpen.value = true
})

const handleOk = () => {
    isOpen.value = false
}

const handleClose = () => {
    isOpen.value = false
}
</script>
