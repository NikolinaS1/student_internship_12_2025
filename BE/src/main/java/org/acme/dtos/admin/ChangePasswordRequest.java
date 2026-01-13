package org.acme.dtos.admin;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
        @NotBlank String newPassword) {}
