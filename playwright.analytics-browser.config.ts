import {fileURLToPath} from 'node:url';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e-audit',testMatch:'analytics-browser.spec.ts',workers:1,retries:0,timeout:150000,reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../evidence/pwa/analytics-browser/playwright.json',import.meta.url))}]],use:{actionTimeout:15000,baseURL:'http://127.0.0.1:3520',trace:'retain-on-failure'},outputDir:'test-results/analytics-browser'});
