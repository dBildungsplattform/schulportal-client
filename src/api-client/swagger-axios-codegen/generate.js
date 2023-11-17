const { codegen } = require('swagger-axios-codegen')
codegen({
  methodNameMode: 'operationId',
  remoteUrl:'http://127.0.0.1:9090/docs-json',
  outputDir: './api-client/swagger-axios-codegen/services',
})