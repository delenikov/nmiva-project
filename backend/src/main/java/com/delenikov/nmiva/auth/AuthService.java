package com.delenikov.nmiva.auth;

import com.delenikov.nmiva.common.ApiException;
import com.delenikov.nmiva.settings.UserSettings;
import com.delenikov.nmiva.settings.UserSettingsRepository;
import com.delenikov.nmiva.user.User;
import com.delenikov.nmiva.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository userRepository;
  private final UserSettingsRepository userSettingsRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.findByEmailIgnoreCase(request.email()).isPresent()) {
      throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
    }

    User user = new User();
    user.setEmail(request.email().toLowerCase());
    user.setDisplayName(request.displayName());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user = userRepository.save(user);

    UserSettings settings = new UserSettings();
    settings.setUserId(user.getId());
    settings.setCurrency("EUR");
    settings.setPushEnabled(true);
    userSettingsRepository.save(settings);

    String token = jwtService.generateToken(user.getId(), user.getEmail());
    return new AuthResponse(token, toMe(user));
  }

  public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmailIgnoreCase(request.email())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    String token = jwtService.generateToken(user.getId(), user.getEmail());
    return new AuthResponse(token, toMe(user));
  }

  public UserMeResponse me(Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    return toMe(user);
  }

  private UserMeResponse toMe(User user) {
    return new UserMeResponse(user.getId(), user.getEmail(), user.getDisplayName());
  }
}
