package org.acme.services;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.stream.Collectors;
import org.acme.models.User;
import org.acme.dtos.admin.UserResponse;
import org.acme.dtos.admin.CreateUserRequest;
import org.acme.dtos.admin.ChangePasswordRequest;
import org.acme.dtos.admin.UpdateUserRequest;

@ApplicationScoped
    public class AdminService {
    public List<UserResponse> getAllUsers() {
        return User.<User>listAll()
                .stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());

    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        User user = new User();
        user.setName(request.username());
        user.setPassword(hashPassword(request.password()));
        user.setRole(request.role());

        user.persist();
        return UserResponse.from(user);
    }


    @Transactional
    public boolean deleteUser(Long id) {
        return User.deleteById(id);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = User.findById(userId);

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        user.setPassword(hashPassword(request.newPassword()));
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = User.findById(id);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        user.setName(request.username());
        user.setRole(request.role());
        //user.persist(); // saves changes
        return UserResponse.from(user);
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();

        } catch (Exception e) {
            throw new RuntimeException("Password hashing failed", e);
        }
    }


}
