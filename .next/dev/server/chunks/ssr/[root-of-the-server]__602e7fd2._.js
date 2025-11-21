module.exports = [
"[project]/pages/index.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page,
    "getServerSideProps",
    ()=>getServerSideProps
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$plasmicapp$2f$loader$2d$nextjs$2f$dist$2f$index$2e$esm$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@plasmicapp/loader-nextjs/dist/index.esm.js [ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$plasmicapp$2f$loader$2d$react$2f$dist$2f$index$2e$esm$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@plasmicapp/loader-react/dist/index.esm.js [ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$plasmic$2d$init$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/plasmic-init.ts [ssr] (ecmascript)");
;
;
;
async function getServerSideProps() {
    const data = await __TURBOPACK__imported__module__$5b$project$5d2f$plasmic$2d$init$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["PLASMIC"].fetchComponentData("Home");
    return {
        props: {
            __plasmicLoaderData: data
        }
    };
}
function Page() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$plasmicapp$2f$loader$2d$react$2f$dist$2f$index$2e$esm$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["PlasmicComponent"], {
        component: "Home"
    }, void 0, false, {
        fileName: "[project]/pages/index.jsx",
        lineNumber: 15,
        columnNumber: 10
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__602e7fd2._.js.map