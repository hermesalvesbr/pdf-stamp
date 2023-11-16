<script setup lang="ts">
import { usePDFNav } from '../composables/usePDFNav'
const navModule = new usePDFNav()
const menuItens = navModule.getMenu()
</script>
<template>
    <v-list
        v-context-menu="'contextMenu'"
        scope="content-navigation"
        class="content-navigation"
        tabindex="-1"
        nav
        :mandatory="false"
    >
        <h1 style="padding-bottom: 10px">Assine PDF</h1>
        <v-list-item
            v-for="item of menuItens"
            :key="item?.meta.icon"
            v-tooltip="item?.meta.label"
            :to="`${item.path}`"
        >
            <v-list-item-icon>
                <v-icon :name="item?.meta.icon" />
            </v-list-item-icon>
            <v-list-item-content> {{ item?.meta.label }} </v-list-item-content>
        </v-list-item>
    </v-list>
</template>
