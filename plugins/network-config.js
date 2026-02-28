const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');

/**
 * Expo config plugin that adds a network_security_config.xml to allow
 * cleartext (HTTP) traffic to our backend server IP.
 * Android 9+ blocks HTTP by default even with usesCleartextTraffic.
 */
function withNetworkSecurityConfig(config) {
  // 1. Modify AndroidManifest to reference the network security config
  config = withAndroidManifest(config, (config) => {
    const mainApp = config.modResults.manifest.application?.[0];
    if (mainApp) {
      mainApp.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      mainApp.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });

  // 2. Write the network_security_config.xml file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const resDir = join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );
      mkdirSync(resDir, { recursive: true });

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">89.111.171.11</domain>
    </domain-config>
</network-security-config>`;

      writeFileSync(join(resDir, 'network_security_config.xml'), xml, 'utf-8');
      return config;
    },
  ]);

  return config;
}

module.exports = withNetworkSecurityConfig;
