import { defineModule } from '@directus/extensions-sdk'
import IndexPage from './index.vue'
import MyDocumentsPage from './pages/my-documents.vue'
import MyCertificatePage from './pages/my-certificate.vue'
import SigningPage from './pages/signing.vue'

export default defineModule({
    id: 'pdfsign',
    name: 'Assine PDF',
    icon: 'draw',
    routes: [
        {
            path: '',
            component: IndexPage,
            meta: {
                label: 'Instruções',
                icon: 'info',
                order: 0,
            },
        },
        {
            path: '/pdfsign/my-documents/',
            component: MyDocumentsPage,
            meta: {
                label: 'Meus documentos',
                icon: 'file_open',
                order: 2,
            },
        },
        {
            path: '/pdfsign/signing/',
            component: SigningPage,
            meta: {
                label: 'Assinar PDF',
                icon: 'draw',
                order: 1,
            },
        },
        {
            path: '/pdfsign/my-certificate/',
            component: MyCertificatePage,
            meta: {
                label: 'Meu certificado',
                icon: 'badge',
                order: 3,
            },
        },
    ],
})
