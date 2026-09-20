import {fileURLToPath} from 'node:url';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e-audit',testMatch:'**/*.spec.ts',workers:1,fullyParallel:false,timeout:120000,retries:0,reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../evidence/pwa/playwright.json',import.meta.url))}]],use:{baseURL:'http://127.0.0.1:3520',trace:'retain-on-failure',screenshot:'only-on-failure'},outputDir:'test-results/audit'});
