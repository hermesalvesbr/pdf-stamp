<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DateTime } from 'luxon'
import html2canvas from 'html2canvas'
import { PDFDocument, values } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import Menu from '../components/Menu.vue'
import { usePDFNav } from '../composables/usePDFNav'
const navModule = new usePDFNav()
const currentInfo = navModule.getCurrentRoute()

import { useApi } from '@directus/extensions-sdk'
import { useUserData } from '../composables/useUserData'
import { PageViewport } from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

const api = useApi()
const active_tab = ref(0)
const access_token = ref()

//pdf
const file_ref = ref()
const pdfUrl = ref<string | null>(null)
const pdfFile = ref<File | null>(null)
const uploadedFileID = ref('')
//canvas
const totalPages = ref(0)
const viewport = ref<null | PageViewport>(null)
const canvasElements = ref<{}[]>([])
const renderContext = ref({})
const backupCanvas = ref<
    { width: number; height: number; ctx: CanvasRenderingContext2D }[]
>([])
const canvaContext = ref<{}[] | null[]>([])
const pdfCanvas = ref<never[] | null[]>([])
const stampCoordinates = ref<{ x: number; y: number; page: number }>({
    x: 0,
    y: 0,
    page: 1,
})
const isGetCoordinatesActive = ref<boolean>(false)
//stamp
const customStamp = ref()
const stampIlmage = ref('')
const stampData = ref({
    topText: 'Documento assinado digitalmente',
    fullName: 'Softagon Sistemas',
    date: null,
    location: '',
    bottomText: 'Valide em https://validar.iti.gov.br',
    logo: '',
    certificate: '',
    password: '',
})
const stampedFileId = ref<String>()

const isPasswordShow = ref<boolean>(false)
const passwordError = ref<String | null>(null)
//
const fileDownloadLink = ref()
//pdf upload
const openFileUpload = () => file_ref.value?.click()
const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = await target.files?.[0]

    pdfFile.value = file ? await file : null
    if (pdfFile.value) {
        pdfUrl.value = URL.createObjectURL(pdfFile.value)
        const formData = new FormData()
        formData.append('file', pdfFile.value)
        const dataFile = await useUser.uploadFile(formData)
        if (dataFile) {
            uploadedFileID.value = dataFile.data.id
            active_tab.value++
        }
    }

    createPdfCanvas()
}

//canvas
const setItemRef = (el, idx) => {
    if (el) {
        pdfCanvas.value[idx] = el
    }
}
const createPdfCanvas = async () => {
    const pdf = await pdfjsLib.getDocument(pdfUrl.value!).promise

    totalPages.value = pdf.numPages

    for (let pageIndex = 1; pageIndex <= totalPages.value; pageIndex++) {
        pdf.getPage(pageIndex).then((page) => {
            viewport.value = page.getViewport({ scale: 1 })

            const canvas = pdfCanvas.value[
                pageIndex
            ] as HTMLCanvasElement | null
            if (canvas) {
                canvas.width = viewport.value.width
                canvas.height = viewport.value.height
                canvasElements.value.push(canvas)

                canvaContext.value[pageIndex] = canvas.getContext('2d')
                renderPage(page, pageIndex, canvas)
            }
        })
    }
}
const renderPage = (
    page: pdfjsLib.PDFPageProxy,
    pageIndex: number,
    canvasEl: HTMLCanvasElement
) => {
    renderContext.value = {
        canvasContext: canvaContext.value[pageIndex],
        viewport: viewport.value,
    }
    const renderTask = page.render(renderContext.value)
    renderTask.promise.then(() => {
        backupCanvas.value[pageIndex] = document.createElement('canvas')
        storeCanvas(canvasEl, pageIndex)
    })
}
const storeCanvas = (canvasEl: HTMLCanvasElement, page: number) => {
    backupCanvas.value[page].width = canvasEl.width
    backupCanvas.value[page].height = canvasEl.height
    backupCanvas.value[page].ctx = backupCanvas.value[page].getContext('2d')
    backupCanvas.value[page].ctx.drawImage(canvasEl, 0, 0)
}
const restoreCanvas = (page) => {
    if (canvaContext.value[page]) {
        canvaContext.value[page].drawImage(backupCanvas.value[page], 0, 0)
    }
}

const getCoordinate = (event: MouseEvent, page: number) => {
    const { clientX, clientY } = event
    const x = clientX - pdfCanvas.value[page].getBoundingClientRect().left - 180
    const y = clientY - pdfCanvas.value[page].getBoundingClientRect().top - 55
    canvaContext.value[page].clearRect(
        0,
        0,
        canvasElements.value[page - 1].width,
        canvasElements.value[page - 1].height
    )
    restoreCanvas(page)
    if (isGetCoordinatesActive.value) stampImage(x, y, page)
    stampCoordinates.value.x = x
    stampCoordinates.value.y = y
    stampCoordinates.value.page = page
}
const convertFileSize = (num: number) => {
    if (typeof num !== 'number' || isNaN(num)) {
        throw new TypeError('Expected a number')
    }

    var exponent
    var unit
    var neg = num < 0
    var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    if (neg) {
        num = -num
    }

    if (num < 1) {
        return (neg ? '-' : '') + num + ' B'
    }

    exponent = Math.min(
        Math.floor(Math.log(num) / Math.log(1000)),
        units.length - 1
    )
    num = (num / Math.pow(1000, exponent)).toFixed(2) * 1
    unit = units[exponent]

    return (neg ? '-' : '') + num + ' ' + unit
}

// stamp
const addStampToPdf = async () => {
    const { x, y, page } = stampCoordinates.value
    const pdfBytes = await pdfFile.value.arrayBuffer()
    const watermarkImageBytes = await fetch(stampIlmage.value).then((res) =>
        res.arrayBuffer()
    )
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const stampedPage = pdfDoc.getPage(page - 1)
    const { height } = stampedPage.getSize()
    const image = await pdfDoc.embedPng(watermarkImageBytes)
    stampedPage.drawImage(image, {
        x: x + 25,
        y: height - y - 60,
        width: 190,
        height: 50,
    })
    const watermarkedPdfBytes = await pdfDoc.save({ useObjectStreams: false })
    const updatedFile = new File(
        [
            new Blob([watermarkedPdfBytes], {
                type: 'application/pdf',
            }),
        ],
        'stamped_pdf'
    )
    const formData = new FormData()
    formData.append('file', updatedFile, pdfFile.value.name)

    useUser.updateFile(formData, uploadedFileID.value).then(({ data }) => {
        active_tab.value++
        isGetCoordinatesActive.value = false
        stampedFileId.value = data.id
    })
}

async function addCertificate() {
    const endpointResponse = await useUser.addCertificate(
        pdfFile.value,
        stampData.value,
        stampedFileId.value
    )
    pdfUrl.value = `${endpointResponse.pdfUrl}&access_token=${access_token.value}`
    passwordError.value = endpointResponse.passwordError
    if (endpointResponse.active_tab) active_tab.value++
}

const stampImage = async (x: number, y: number, page: number) => {
    const canvasImage = await html2canvas(customStamp.value, {
        backgroundColor: null,
        useCORS: true,
        imageTimeout: 3000,
        logging: false,
    })
    canvaContext.value[page].drawImage(canvasImage, x, y, 190, 50)
    stampIlmage.value = canvasImage.toDataURL('image/png')
}
const useUser = new useUserData()
const certificate = ref(null)
async function initStamp() {
    const { data } = await useUser.getMe()
    certificate.value = await useUser.getCertificate(data.id)
    stampData.value.certificate = certificate.value
    stampData.value.logo = data.avatarUrl
    stampData.value.location = data.location
    stampData.value.date = DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss')
    stampData.value.fullName = `${data.first_name} ${data.last_name}`
}
onMounted(async () => {
    initStamp()
    access_token.value = await useUser.getUserToken()
})
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
        <div class="container" v-if="certificate !== null">
            <v-card
                id="upload-card"
                v-if="active_tab == 0"
                class="upload-card"
                @click="openFileUpload"
            >
                <v-icon name="add_circle" color="green" small></v-icon>
                <v-text-overflow
                    text="Selecione o PDF para assinar"
                ></v-text-overflow>
                <input
                    type="file"
                    ref="file_ref"
                    accept=".pdf"
                    @change="handleFileChange"
                    hidden
                />
            </v-card>
            <div id="pdf" v-if="active_tab == 1">
                <div class="d-flex card_insight">
                    <div class="file_info">
                        <v-icon
                            size="large"
                            color="red"
                            name="picture_as_pdf"
                        ></v-icon>
                        <span class="purple darken-2 mx-2 file_name">{{
                            pdfFile.name
                        }}</span>
                        <span class="file_size">{{
                            convertFileSize(pdfFile.size)
                        }}</span>
                    </div>
                    <div class="instructions_bloc py-3">
                        <span class="font-weight-medium"
                            >Certifique-se de que o documento correto foi
                            carregado.</span
                        >
                        <p>
                            em seguida, clique em 'Avançar' para escolher o
                            local da assinatura no documento.
                        </p>
                    </div>
                    <v-notice
                        v-if="isGetCoordinatesActive"
                        type="info"
                        icon="tips_and_updates"
                        class="w-100"
                        >Clique para informar o local que será carimbado com sua
                        assinatura digital.
                    </v-notice>
                </div>
                <v-card
                    :class="{
                        'mw-100 canva_card': true,
                        canva_container: isGetCoordinatesActive === true,
                    }"
                >
                    <v-card-text class="d-flex align-center">
                        <div>
                            <div
                                v-for="pageIndex in totalPages"
                                :key="pageIndex"
                            >
                                <div class="pdf-page">
                                    <canvas
                                        :ref="(el) => setItemRef(el, pageIndex)"
                                        @mousedown="
                                            getCoordinate($event, pageIndex)
                                        "
                                    ></canvas>
                                    <p class="page-number">
                                        {{ pageIndex }} / {{ totalPages }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <v-card
                v-if="active_tab == 2"
                class="upload-card password_card d-flex flex-column align-items-start"
            >
                <v-text-overflow
                    text="Digite a senha do certificado"
                ></v-text-overflow>
                <div class="d-flex flex-column w-100 password_check">
                    <form @submit.prevent="stampData.password.length > 3">
                        <v-input
                            :type="isPasswordShow ? 'text' : 'password'"
                            v-model="stampData.password"
                            placeholder="Senha do Certificado Digital"
                            small
                            autofocus
                            class="w-50"
                        />
                        <span v-if="passwordError" class="error">{{
                            passwordError
                        }}</span>
                        <v-checkbox
                            v-model="isPasswordShow"
                            label="Exibir senha"
                        ></v-checkbox>
                    </form>
                </div>
            </v-card>
            <v-card
                v-if="active_tab == 3"
                @click="fileDownloadLink.click()"
                class="mw-100 download_card"
            >
                <a
                    :href="pdfUrl"
                    ref="fileDownloadLink"
                    :download="pdfFile.name"
                    hidden
                ></a>
                <v-card-text
                    class="d-flex align-center justify-space-between p-4"
                >
                    <div>
                        <v-icon
                            size="large"
                            color="red"
                            name="picture_as_pdf"
                        ></v-icon>
                        <span class="file_name">{{ pdfFile.name }}</span>
                    </div>
                    <v-icon
                        size="large"
                        color="blue"
                        name="file_download"
                    ></v-icon>
                </v-card-text>
            </v-card>
            <v-card class="nav_btns mw-100">
                <v-card-actions
                    class="d-flex justify-space-between align-center p-4"
                >
                    <v-button
                        v-if="active_tab > 0 && active_tab < 3"
                        outlined
                        class="outlined_btn"
                        @click="active_tab = active_tab - 1"
                    >
                        Retornar
                    </v-button>

                    <v-button
                        v-if="active_tab == 1 && !isGetCoordinatesActive"
                        class="filled_btn"
                        @click="isGetCoordinatesActive = true"
                    >
                        Avançar
                    </v-button>
                    <v-button
                        v-if="active_tab == 1 && isGetCoordinatesActive"
                        class="px-5 text-subtitle-2"
                        @click="addStampToPdf"
                    >
                        Avançar
                    </v-button>
                    <v-button
                        v-if="active_tab == 2"
                        class="px-5 text-subtitle-2"
                        @click="addCertificate"
                    >
                        Avançar
                    </v-button>
                </v-card-actions>

                <v-card-text
                    align-content="center"
                    id="success"
                    v-if="active_tab > 2"
                    class="background-color='primary' !important"
                >
                    <v-info
                        icon="picture_as_pdf"
                        title="Documento assinado"
                        type="success"
                        class="padding: 2px"
                        >O PDF foi assinado corretamente, você pode fazer o
                        download.</v-info
                    ><br /><br />
                    <v-button
                        full-width="true"
                        :href="pdfUrl"
                        :download="pdfFile.name"
                        >Baixar {{ pdfFile.name }}
                    </v-button>
                </v-card-text>
            </v-card>
        </div>
        <div class="container" v-else>
            <v-card
                id="upload-card"
                v-if="active_tab == 0"
                class="upload-card"
                @click="$router.push('/content/certificado/')"
            >
                <div>
                    Você esqueceu de cadastrar o certificado digital tipo A1
                </div>
            </v-card>
        </div>
        <div ref="customStamp" class="d-flex line-height-2 custom_stamp">
            <div class="logo_container">
                <img
                    id="stamp_logo"
                    :src="stampData.logo"
                    :alt="stampData.fullName"
                />
            </div>
            <div class="d-flex flex-column stamp_content line-height-2">
                <small>{{ stampData.topText }}</small>
                <div class="d-flex align-start flex-column py-1">
                    <strong>{{ stampData.fullName }}</strong>
                    <small>Data: {{ stampData.date }}</small>
                    <small v-if="stampData.location"
                        >Local: {{ stampData.location }}</small
                    >
                </div>
                <small>{{ stampData.bottomText }}</small>
            </div>
        </div>
    </private-view>
</template>

<style scoped>
:root {
    --btn-color: #0d47a1 !important;
}
.container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 4rem;
}
/* //suctom stamp  */
.custom_stamp {
    width: fit-content;
    position: absolute;
    left: -100rem;
}
.logo_container {
    /* height: 7rem; */
    height: 7rem;
    padding: 1rem;
    margin: 0px 0px 0px 0px;
}
.logo_container img {
    height: 100%;
    object-fit: cover;
}
.stamp_content {
    font-size: 0.9rem !important;
    color: #333333 !important;
    padding: 1rem !important;
    padding-left: 0 !important;
    padding-right: 5px !important;
    align-items: flex-start !important;
}
.stamp_content strong {
    text-transform: uppercase;
    color: #333333 !important;

    font-weight: 600 !important;
}
.canva_container {
    width: 100%;
    height: 100vh;
    background: linear-gradient(to bottom, #ddd8d8, #fff);
    animation: backgroundAnimation 4s ease infinite;
}

@keyframes backgroundAnimation {
    0% {
        background: linear-gradient(to bottom, #ddd8d8, #fff);
    }
    50% {
        background: linear-gradient(to bottom, #fff, #ddd8d8);
    }
    100% {
        background: linear-gradient(to bottom, #ddd8d8, #fff);
    }
}

.upload-card {
    display: flex;
    align-items: center;
    padding: 1.5rem;
    max-width: 100%;
    cursor: pointer;
}
.upload-card:hover {
    opacity: 0.8;
}
.v-text-overflow {
    padding: 0 0.5rem;
}
.mw-100 {
    max-width: 100%;
}
.w-100 {
    width: 100%;
}
.d-flex {
    display: flex;
    align-items: center;
    justify-content: center;
}
.pdf-page {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
}
.card_insight {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem 0;
}
.file_info {
    font-weight: 700;
    font-size: 1.3rem;
}
.file_size {
    margin: 0 0.75rem;
}
.instructions_bloc {
    display: flex;
}
.instructions_bloc span {
    font-weight: 600;
}
.canva_card {
    max-height: 45rem;
    margin: 1rem 0;
}
/* nav btns */

.nav_btns {
    padding: 2rem 0;
    background-color: #ffffff !important;
    position: sticky;
    bottom: 0;
}
.outlined_btn {
    color: var(--btn-color);
    border-radius: 3rem;
    border: 1px solid var(--btn-border);
}
.filled_btn {
    background-color: var(--btn-border);
    border-radius: 3rem;
}
.justify-space-between {
    justify-content: space-between !important;
}

.flex-column {
    flex-direction: column;
}
.py-1 {
    padding: 0.25 0;
}
.align-start {
    align-items: flex-start !important;
}
.align-center {
    align-items: center !important;
}
.line-height-2 {
    line-height: 1.8 !important;
}
/* // */
.download_card {
    cursor: pointer;
}
.file_name {
    font-weight: 500 !important;
    margin: 0 0.5rem;
    color: var(--btn-color);
}
.p-4 {
    padding: 1rem;
}
.py-3 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
}
.purple .darken-2 {
    color: var(--btn-border);
}

.password_card {
    align-items: start !important;
}
/* .password_card .v-text-overflow:first-child {
  width: 37% !important;
} */
.password_check {
    align-items: start !important;
    padding: 1rem 0 !important;
}
.password_check .v-checkbox {
    margin: 0.5rem 0;
}
.error {
    color: #e14e4e;
    font-size: 1rem;
    padding: 0.3rem 0;
}
</style>
