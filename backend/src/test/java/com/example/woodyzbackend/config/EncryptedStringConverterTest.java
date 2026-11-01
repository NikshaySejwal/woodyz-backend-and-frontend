package com.example.woodyzbackend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class EncryptedStringConverterTest {

    private final EncryptedStringConverter converter = new EncryptedStringConverter();

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
}
