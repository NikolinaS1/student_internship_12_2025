package org.acme.dtos.messages;

import java.time.LocalDateTime;

public record MessageResponse(
    Long id,
    Long caseId,
    Long senderId,
    String senderName,
    String content,
    LocalDateTime createdAt
) {
}
