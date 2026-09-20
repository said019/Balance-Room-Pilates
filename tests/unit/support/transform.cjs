const transformer = require('@swc/jest').createTransformer({jsc:{parser:{syntax:'typescript',tsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'},sourceMaps:'inline'});
module.exports={...transformer,process(source,path,options){return transformer.process(source.replace(/import\.meta\.env/g,'globalThis.__VITE_ENV__'),path,options);}};
