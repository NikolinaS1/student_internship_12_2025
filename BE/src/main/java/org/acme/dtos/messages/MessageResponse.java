package org.acme.dtos.messages;

import java.time.LocalDateTime;

public record MessageResponse(
    Long id,
    Long caseId,
    Long senderId,
    String content,
    LocalDateTime createdAt
) {
}
