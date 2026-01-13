package org.acme.dtos.admin;

import org.acme.enums.Role;

public record CreateUserRequest(
        String username,
        String password,
        Role role
) {}
