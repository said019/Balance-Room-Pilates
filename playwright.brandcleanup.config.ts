import {fileURLToPath} from 'node:url';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e-configuration',testMatch:'catalog.spec.ts',workers:1,retries:0,timeout:150000,reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../evidence/brandcleanup/playwright.json',import.meta.url))}]],use:{baseURL:'http://127.0.0.1:3531',actionTimeout:15000,trace:'retain-on-failure'},outputDir:'test-results/brandcleanup'});
