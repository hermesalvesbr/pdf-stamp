import { defineEndpoint } from '@directus/extensions-sdk'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { toArray } from '@directus/utils'
import { sign } from 'pdf-signer-brazil'
import { DateTime } from 'luxon'

import multer from 'multer'
import { Readable } from 'stream'

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
interface RequestBody {
    email: string
    location: string
    reason: string
    first_name?: string
    last_name?: string
    fullName?: string
}
function criarSlug(pdfName: string): string {
    const semPdf = pdfName.replace('.pdf', '')
    const stringSemAcentos = semPdf
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    const slug = stringSemAcentos
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[-\s]+/g, '-')
    return slug
}

// Exemplo de uso da função
const titulo: string =
    'Lei Municipal nº 3.027.2022 - Institui a nova Lei de Inovações Tecnológicas do Município de Araripina-PE'
const slug: string = criarSlug(titulo)

export default defineEndpoint(async (router, { env, services }) => {
    router.post('/hello', (req: any, res: any) => res?.send('Hello, World!'))
    router.post('/', upload.any(), async (req: any, res: any) => {
        //Test empty situation
        if (Object.keys(req?.body).length === 0) {
            return res.send({
                status: '404',
                message: 'empty request',
                value: null,
                req: { req },
            })
        }
        const { FilesService, UsersService } = services
        const filesService = new FilesService({
            schema: req?.schema,
            accountability: req?.accountability,
        })
        const usersService = new UsersService({
            schema: req?.schema,
            accountability: req?.accountability,
        })
        let user: RequestBody = {
            email: '',
            location: '',
            reason: '',
            first_name: '',
            last_name: '',
            fullName: '',
        }
        const within_directus = req?.body.within_directus
        const pdf_file = within_directus ? req?.body.pdf : req?.files[0]
        const pdf_name = pdf_file.originalname
            ? pdf_file.originalname.split('.')[0]
            : req.body.pdf_name
        const pdf_slug = criarSlug(pdf_name)
        const certificate = req?.files[1]
        const { password, date, bottomText, topText } = req.body
        const certificate_id = req?.body.certificate

        if (within_directus) {
            try {
                const result = await usersService.readOne(
                    req.accountability.user
                )
                if (result) {
                    const {
                        email,
                        location,
                        reason,
                        first_name,
                        last_name,
                        fullName,
                    } = result
                    user = {
                        email,
                        location,
                        reason,
                        first_name,
                        last_name,
                        fullName,
                    }
                }
            } catch (error) {
                console.log('get user error', error)
            }
        } else {
            const { email, location, reason, fullName }: RequestBody = req.body
            user = { email, location, reason, fullName }
        }
        const certificateFilePath = within_directus
            ? `${env.PWD}/uploads/${certificate_id}.pfx`
            : `${env.PWD}/uploads/temp_certificate.pfx`
        const pdfFilePath = within_directus
            ? `${env.PWD}/uploads/${pdf_file}.pdf`
            : `${env.PWD}/uploads/temp_pdf.pdf`
        if (!within_directus) {
            writeFileSync(certificateFilePath, certificate.buffer)
            writeFileSync(pdfFilePath, pdf_file.buffer)
        }
        const pdfBuffer = readFileSync(pdfFilePath)
        const p12Buffer = readFileSync(certificateFilePath)

        const dataHoraLocalBR = DateTime.local()
            .setZone('America/Sao_Paulo')
            .toFormat('dd/MM/yyyy HH:mm:ss')

        const { email, location, reason, first_name, last_name, fullName } =
            user
        const signature = fullName ? fullName : `${first_name} ${last_name}`
        const externalSignatureCoordinates = {
            left: 20,
            bottom: 120,
            right: 190,
            top: 20,
        }
        const directusSignatureCoordinates = {
            left: -600,
            bottom: -600,
            right: 0,
            top: 0,
        }
        const asignatureOptions = {
            reason: reason,
            email: email,
            location: location,
            signerName: signature,
            annotationAppearanceOptions: {
                signatureCoordinates: within_directus
                    ? directusSignatureCoordinates
                    : externalSignatureCoordinates,

                signatureDetails: [
                    {
                        value: signature,
                        fontSize: 5,
                        transformOptions: {
                            rotate: 0,
                            space: 2,
                            tilt: 0,
                            xPos: 0,
                            yPos: 32,
                        },
                    },
                    {
                        value: topText
                            ? topText
                            : 'Documento assinado digitalmente',
                        fontSize: 5,
                        transformOptions: {
                            rotate: 0,
                            space: 2,
                            tilt: 0,
                            xPos: 0,
                            yPos: 25.4,
                        },
                    },
                    {
                        value: `Assinado em ${date ? date : dataHoraLocalBR}`,
                        fontSize: 5,
                        transformOptions: {
                            rotate: 0,
                            space: 2,
                            tilt: 0,
                            xPos: 0,
                            yPos: 18,
                        },
                    },
                    {
                        value: bottomText
                            ? bottomText
                            : 'Valide este PDF: https://validar.iti.gov.br/',
                        fontSize: 5,
                        transformOptions: {
                            rotate: 0,
                            space: 2,
                            tilt: 0,
                            xPos: 0,
                            yPos: 11,
                        },
                    },
                ],
            },
        }
        try {
            const signedPdf = await sign(
                pdfBuffer,
                p12Buffer,
                password,
                asignatureOptions
            )

            let readStream = Readable.from(signedPdf)
            filesService
                .uploadOne(readStream, {
                    storage: toArray(env['STORAGE_LOCATIONS'])[0],
                    filename_disk: `${pdf_slug}-assinado-softagon`,
                    filename_download: `${pdf_slug}-assinado-softagon.pdf`,
                    title: `${pdf_slug}-assinado-softagon`,
                    type: 'application/pdf',
                })
                .then((response: any) => {
                    if (!within_directus) unlinkSync(certificateFilePath)
                    unlinkSync(pdfFilePath)
                    const result = within_directus
                        ? response
                        : `https://assinador.softagon.app/assets/${response}.pdf`
                    const returnResponse = {
                        status: '200',
                        message: 'success',
                        file: result,
                        req: {
                            user: req.body,
                        },
                    }
                    res.status(200).json(returnResponse)
                })
                .catch((err: Error) => {
                    console.error('error', err)
                    const returnResponse = {
                        status: '500',
                        message: 'internal server error',
                        file: null,
                        req: {
                            user: req.body,
                        },
                    }
                })
        } catch (error) {
            console.error(error)
            res.status(500).json('Error signing pdf')
        }
    })
})
