import '@testing-library/jest-dom';
(globalThis as any).__VITE_ENV__={MODE:'test',PROD:false,DEV:false,VITE_API_URL:'/api'};
Object.defineProperty(window,'matchMedia',{writable:true,value:jest.fn().mockImplementation(query=>({matches:false,media:query,onchange:null,addListener:jest.fn(),removeListener:jest.fn(),addEventListener:jest.fn(),removeEventListener:jest.fn(),dispatchEvent:jest.fn()}))});
global.ResizeObserver=class {observe(){} unobserve(){} disconnect(){}};
Element.prototype.scrollIntoView=jest.fn();
