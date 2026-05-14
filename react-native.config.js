module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.deuna.wallets.DeunaWalletsPackage;',
        packageInstance: 'new DeunaWalletsPackage()',
      },
    },
  },
};
