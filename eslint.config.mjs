import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,

    {
        rules: {
            "no-restricted-syntax": [
                "error",
                {
                    selector:
                        "NewExpression[callee.name='Date'][arguments.length=0]",
                    message:
                        "Do not use new Date() directly. Use AppTime.now() instead.",
                },
                {
                    selector:
                        "CallExpression[callee.object.name='Date'][callee.property.name='now'][arguments.length=0]",
                    message:
                        "Do not use Date.now() directly. Use AppTime.now().getTime() instead.",
                },
            ],
        },
    },

    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;
