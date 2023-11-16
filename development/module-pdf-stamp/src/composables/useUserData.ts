import { useApi } from '@directus/extensions-sdk'
export class useUserData {
    api: any
    constructor() {
        this.api = useApi()
    }
    getUserToken() {
        return (
            this.api.defaults.headers.common['Authorization']?.split(' ')[1] ||
            null
        )
    }

    async deleteFile(id: String) {
        const res = await this.api.delete(`/files/${id}`)
        return res
    }

    async uploadFile(formData: FormData) {
        try {
            const { data } = await this.api.post('/files', formData)
            console.log('fez o upload do arquivo')
            if (data) {
                return data
            }
        } catch (error) {
            console.error(error)
        }
    }

    async updateFile(formData: FormData, id: String) {
        try {
            const { data } = await this.api.patch(`/files/${id}`, formData)
            console.log('atualizou O arquivo')
            if (data) {
                return data
            }
        } catch (error) {
            console.error(error)
        }
    }

    async getFolderId(folderName = 'pdf') {
        try {
            const { data } = await this.api.get(
                `/folders/?filter[name][_eq]=${folderName}`
            )
            if (data[0]?.id) {
                return data[0].id
            }
            return null
        } catch (error) {
            console.error(error)
        }
    }

    async getMe() {
        try {
            const imageSize = 80
            const quality = 80
            const projectUrl = await this.myDomainUrl()
            const { data } = await this.api.get('/users/me')
            if (data.data?.avatar) {
                data.data.avatarUrl = `${projectUrl}/assets/${data.data.avatar}?fit=cover&width=${imageSize}&height=${imageSize}&quality=${quality}`
            } else {
                const projectLogo = await this.getLogo()
                data.data.avatarUrl = `${projectUrl}/assets/${projectLogo}?fit=cover&width=${imageSize}&height=${imageSize}&quality=${quality}`
            }
            data.data.certificate = await this.getCertificate(data.data.id)
            data.data.project_url = projectUrl
            return data
        } catch (e: any) {
            throw new Error(e.message)
        }
    }

    async getLogo() {
        try {
            const { data } = await this.api.get('/settings/')
            if (data) {
                return data.data.project_logo
            }
            return null
        } catch (e: any) {
            throw new Error(e.message)
        }
    }
    async getProjectUrl() {
        try {
            const { data } = await this.api.get('/settings/')
            if (data) {
                return data.data.project_url
            }
            return null
        } catch (e: any) {
            throw new Error(e.message)
        }
    }

    async myDomainUrl() {
        const projectUrl = await this.getProjectUrl()
        if (!projectUrl) {
            const dominio = window.location.origin
            return dominio
        } else {
            return projectUrl
        }
    }
    async getCertificate(userID: string) {
        try {
            const { data } = await this.api.get(
                '/items/certificado?filter[usuario][_eq]=' + userID
            )
            if (data?.data?.length > 0) {
                return data.data[0].certificado
            } else {
                return null
            }
        } catch (e: any) {
            throw new Error(e.message)
        }
    }

    async addCertificate(pdfFile, stampData, stampedFileId) {
        const formData = new FormData()
        const file = stampedFileId
        let responseEndpoint = {
            pdfUrl: null as any,
            passwordError: 'Senha incorreta' as any,
            active_tab: false,
        }
        formData.append('pdf', file)
        formData.append('pdf_name', pdfFile.name)
        formData.append('certificate', stampData.certificate)
        formData.append('password', stampData.password)
        formData.append('date', stampData.date)
        formData.append('within_directus', 'true')
        try {
            const res = await this.api.post('/sign-pdf', formData, {
                headers: {
                    'content-type': 'multipart/form-data',
                },
            })

            if (res?.data) {
                responseEndpoint = {
                    pdfUrl: `/assets/${res.data.file}.pdf?download`,
                    passwordError: null,
                    active_tab: true,
                }
                return responseEndpoint
            } else {
                return responseEndpoint
            }
        } catch (e) {
            console.log(responseEndpoint)
            return responseEndpoint
        }
    }
}
