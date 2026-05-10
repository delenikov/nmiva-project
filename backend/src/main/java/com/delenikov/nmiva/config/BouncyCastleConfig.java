package com.delenikov.nmiva.config;

import java.security.Provider;
import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BouncyCastleConfig {

  @Bean
  public Provider bouncyCastleProvider() {
    Provider existing = Security.getProvider(BouncyCastleProvider.PROVIDER_NAME);

    if (existing != null) {
      return existing;
    }

    Provider provider = new BouncyCastleProvider();
    Security.addProvider(provider);
    return provider;
  }
}
