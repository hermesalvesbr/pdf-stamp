import { useRouter, useRoute, Route, Router } from 'vue-router'
export class usePDFNav {
    router: Router
    route: Route

    constructor() {
        this.router = useRouter()
        this.route = useRoute()
    }

    getMenu() {
        const routes = this.router.getRoutes()

        const menuItems = routes
            .reduce(
                (uniqueRoutes: any[], route: { path: string | string[] }) =>
                    route.path.includes('pdfsign') &&
                    !uniqueRoutes.some(
                        (r: { path: any }) => r.path === route.path
                    )
                        ? [...uniqueRoutes, route]
                        : uniqueRoutes,
                []
            )
            .sort(
                (
                    a: { meta: { order: number } },
                    b: { meta: { order: number } }
                ) => a.meta.order - b.meta.order
            )
        return menuItems
    }

    getCurrentRoute() {
        const routeParts = this.route.path.split('/')
        const currentRoute = routeParts[routeParts.length - 1]
        const menu = this.getMenu()
        if (this.hasOneOrNoSlash(currentRoute)) {
            return this.route
        } else {
            return menu.filter((route) => route.path.includes(currentRoute))
        }

        return null
    }
    hasOneOrNoSlash(text) {
        const regex = /\/[^/]*$/
        return !regex.test(text)
    }
}
