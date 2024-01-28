module.exports = [
    {
        path: "/v1/api/devices",
        route: require("./v1/api/devices.js")
    },
    {
        path: "/v1/api/people",
        route: require("./v1/api/people.js")
    },
    {
        path: "/v1/api/oauth20",
        route: require("./v1/api/oauth20.js")
    },
    {
        path: "/v1/api/provider",
        route: require("./v1/api/provider.js")
    },
    {
        path: "/v1/api/support",
        route: require("./v1/api/support.js")
    },
    {
        path: "/v1/api/content",
        route: require("./v1/api/content.js")
    },
    {
        path: "/v1/api/admin",
        route: require("./v1/api/admin.js")
    },
    {
        path: "/webui",
        route: require("./webui/index.js")
    }
]