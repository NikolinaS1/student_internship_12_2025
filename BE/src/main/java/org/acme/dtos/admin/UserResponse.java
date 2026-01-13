package org.acme.dtos.admin;
import org.acme.models.User;
import org.acme.enums.Role;

public record UserResponse(
        Long id,
        String username,
        Role role
) {

    public static UserResponse from(User user) {

        return new UserResponse(
                user.id,
                user.getName(),
                user.getRole()
        );
    }

}
