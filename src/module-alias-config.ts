const moduleAlias = require('module-alias');
const path = require('path');

moduleAlias.addAliases({
  '@workers': path.join(__dirname, '')
});

export {};
