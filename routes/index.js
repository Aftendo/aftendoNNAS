module.exports = [
    {
        path : "/v1/api/people",
        route : require("./v1/api/people.js")
    },
    {
        path : "/v1/api/oauth20",
        route : require("./v1/api/oauth20.js")
    }
]