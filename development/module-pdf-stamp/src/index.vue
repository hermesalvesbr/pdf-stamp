<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Menu from './components/Menu.vue'
import { usePDFNav } from './composables/usePDFNav'

const activePage = ref()
const isMobile = ref(window.innerWidth <= 768)
const ilustracao: string[] = []
ilustracao[0] =
    'https://cidadetransparente.softagon.app/assets/671122aa-5078-490e-9d4e-3ecac8e0088d'
ilustracao[1] =
    'https://cidadetransparente.softagon.app/assets/7e744746-f5e4-42af-9d25-b16972694a9a'
ilustracao[2] =
    'https://cidadetransparente.softagon.app/assets/6e0c6c1e-9fb1-4db4-b42c-173438b502cc'
const checkIsMobile = () => {
    isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
    window.addEventListener('resize', checkIsMobile)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', checkIsMobile)
})
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

        <div id="instrucoes"  >
            <div class="v-tabs-items">
                <v-tabs v-model="activePage" :vertical="isMobile">
                    <v-tab class="passo"> Passo 1: Certificado Digital </v-tab>
                    <v-tab class="passo"
                        >Passo 2: Documentos para assinar</v-tab
                    >
                    <v-tab class="passo">Passo 3: Assinando</v-tab>
                </v-tabs>

                <v-tabs-items
                    v-model="activePage"
                    style="height: 100%; padding: 32px !important"
                >
                    <v-tab-item class="instrucoes">
                        <div class="contexto">
                            <div class="texto">
                                <p>
                                    O primeiro passo é fazer o upload do seu
                                    certificado digital para a nossa plataforma.
                                </p>
                                <br />
                                <ul>
                                    <li>
                                        Você necessita ter adquirido um
                                        Certificado Digital do tipo A1.
                                    </li>
                                    <li>
                                        <a href="pdfsign/my-certificate/"
                                            >Clique</a
                                        >
                                        em "Meu certificado", logo ao lado e
                                        envie o certificado com extensão .pfx
                                    </li>
                                    <li>
                                        A Softagon não irá salvar a senha do seu
                                        Certificado Digital.<br />
                                        <em
                                            >Certificado sem senha não pode
                                            assinar nada.</em
                                        >
                                    </li>
                                </ul>
                            </div>
                            <div class="imagem">
                                <img
                                    :src="`${ilustracao[0]}?format=webp&height=200`"
                                    alt="Mulher assinando certificado"
                                />
                            </div>
                        </div>
                    </v-tab-item>
                    <v-tab-item class="instrucoes">
                        <div class="contexto">
                            <div class="texto">
                                <p>
                                    Você deverá enviar o arquivo PDF do seu
                                    documento, é opcional deixar salvo em nossos
                                    servidores após assinatura.
                                </p>
                                <br />
                                <ul>
                                    <li>
                                        Precisaremos ter acesso ao seu arquivo
                                        para assinar digitalmente.
                                    </li>
                                    <li>
                                        Deixar salvo em nossos servidores é
                                        opcional, caso deixe salvo, a hospedagem
                                        dos seus documentos é gratuito.
                                    </li>
                                    <li>
                                        Não é permitido o envio de arquivos
                                        maiores que 20MB de tamanho.
                                    </li>
                                    <li>
                                        Seus arquivos vão ficar acessíveis no
                                        menu ao lado, Meus documentos.
                                    </li>
                                </ul>
                            </div>
                            <div class="imagem">
                                <img
                                    :src="`${ilustracao[1]}?format=webp&height=200`"
                                    alt="Mulher assinando certificado"
                                />
                            </div>
                        </div>
                    </v-tab-item>
                    <v-tab-item class="instrucoes">
                        <div class="contexto">
                            <div class="texto">
                                <p>
                                    Nossa ferramenta foi inspirada na do Governo
                                    Federal e compartilha uma usabilidade muito
                                    semelhante.
                                </p>
                                <br />
                                <ul>
                                    <li>
                                        No menu ao lado, clique em
                                        <a
                                            href="pdfsign/signing/"
                                            title="Assinar PDF"
                                            >Assinar PDF</a
                                        >
                                    </li>
                                    <li>
                                        Selecione o arquivo PDF que você fez o
                                        upload e deseja assinar.
                                    </li>
                                    <li>
                                        Digite a senha do seu certificado
                                        digital quando solicitado.
                                    </li>
                                    <li>
                                        Aguarde enquanto o sistema realiza a
                                        assinatura digital do arquivo.
                                    </li>
                                    <li>
                                        Faça o download do seu arquivo assinado,
                                        e caso queira, faça uma validação da
                                        assinatura em
                                        <strong
                                            ><a
                                                href="https://validar.iti.gov.br/"
                                                target="_blank"
                                                title="validador"
                                                >https://validar.iti.gov.br/</a
                                            ></strong
                                        >
                                    </li>
                                </ul>
                            </div>
                            <div class="imagem">
                                <img
                                    :src="`${ilustracao[2]}?format=webp&height=200`"
                                    alt="Mulher assinando certificado"
                                />
                            </div>
                        </div>
                    </v-tab-item>
                </v-tabs-items>
            </div>
        </div>
    </private-view>
</template>
<style>
#pdf-sign {
    padding: 32px !important;
    padding-bottom: 70px !important;
}
.passo {
    width: fit-content;
    font-weight: bold;
    flex-basis: auto !important;
    background: var(--primary-10) !important;
}
.instrucoes {
    padding: 30px;
}
.contexto {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

.texto {
    flex: 1;
    order: 1;
}

.imagem {
    flex: 1;
    order: 2; /* Define a ordem do elemento, inicialmente à direita */
    margin-top: 10px;
    margin-left: 20px;
}

@media (max-width: 768px) {
    .contexto {
        flex-direction: column; /* Altera a direção para coluna em tela pequena */
    }

    .texto {
        order: 2; /* Muda a ordem para que o texto apareça abaixo da imagem */
    }

    .imagem {
        order: 1; /* Muda a ordem para que a imagem apareça acima do texto */
        margin-top: 0; /* Remove o espaço acima da imagem */
    }
}
</style>
