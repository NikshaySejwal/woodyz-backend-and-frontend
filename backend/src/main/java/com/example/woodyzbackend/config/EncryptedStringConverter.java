package com.example.woodyzbackend.config;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    private SecretKeySpec key() {
        String configured = System.getenv("SUPPORT_ENCRYPTION_KEY");
        String value = configured == null || configured.isBlank()
                ? "local-development-support-key"
                : configured;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(digest, "AES");
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to initialize support message encryption", exception);
        }
    }

    @Override
    public String convertToDatabaseColumn(String value) {
        if (value == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to encrypt support message", exception);
        }
    }

    @Override
    public String convertToEntityAttribute(String value) {
        if (value == null) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(value);
            byte[] iv = java.util.Arrays.copyOfRange(combined, 0, IV_LENGTH);
            byte[] encrypted = java.util.Arrays.copyOfRange(combined, IV_LENGTH, combined.length);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_LENGTH, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            return value;
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to decrypt support message", exception);
        }
    }
}
