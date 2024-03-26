import { defineConfig } from 'vite';
import packageJson from './package.json';
import preact from '@preact/preset-vite';
import banner from 'vite-plugin-banner'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		banner(`// ==UserScript==
// @name         QTFM Downloader
// @namespace    https://tampermonkey.net/
// @version      ${packageJson.version}
// @description  ${packageJson.description}
// @author       ${packageJson.author}
// @match        *://*.qtfm.cn/channels/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=qtfm.cn
// @grant        GM.xmlHttpRequest
// @grant        GM.download
// @connect      app.qtfm.cn
// @connect      user.qtfm.cn
// @downloadURL  https://gist.githubusercontent.com/oustn/f10d1eab523be2810d89e1a02dd07ad9/raw/QingTingFMDownloader.js
// @updateURL    https://gist.githubusercontent.com/oustn/f10d1eab523be2810d89e1a02dd07ad9/raw/QingTingFMDownloader.js
// ==/UserScript==

// var CON = 2 // /* 设置同时下载的数量 */
`)
	],
	server: {
		port: 3000,
	},
	build: {
		cssCodeSplit: false
	},
	esbuild: {
		legalComments: 'none'
	}
});
