package com.example.woodyzbackend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class EncryptedStringConverterTest {

    private static final String TEST_KEY = "test-support-encryption-key-with-at-least-32-bytes";
    private final EncryptedStringConverter converter = new EncryptedStringConverter(TEST_KEY);

    @Test
    void readsLegacyPlaintextSupportMessages() {
        String legacyMessage = "Delivery update requested";

        assertEquals(legacyMessage, converter.convertToEntityAttribute(legacyMessage));
    }

    @Test
    void encryptedMessagesRoundTrip() {
        String message = "A new support reply";

        assertEquals(message, converter.convertToEntityAttribute(converter.convertToDatabaseColumn(message)));
    }

    @Test
    void refusesMissingOrWeakEncryptionKeys() {
        assertThrows(IllegalStateException.class, () -> new EncryptedStringConverter(null));
        assertThrows(IllegalStateException.class, () -> new EncryptedStringConverter("short"));
    }
}
