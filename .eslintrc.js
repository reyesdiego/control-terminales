module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-console": [
            "error", 
            { allow: ["warn", "error", "info", "log"] }
        ],
        "no-unused-vars": [
            "warn",
            {vars: "all","args": "after-used"}
        ],
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};