<script setup lang="ts">
import Menu from '../components/Menu.vue'
import { usePDFNav } from '../composables/usePDFNav'
const navModule = new usePDFNav()
const currentInfo = navModule.getCurrentRoute()
</script>
<template>
    <private-view :title="currentInfo?.meta.label">
        <template #headline> Assine PDF</template>
        <template #title-outer:prepend>
            <v-button class="header-icon" rounded icon secondary>
                <v-icon :name="currentInfo?.meta.icon" />
            </v-button>
        </template>
        <template #navigation>
            <Menu />
        </template>

        <div id="pdf-sign">Teste de conteudo</div>
    </private-view>
</template>
