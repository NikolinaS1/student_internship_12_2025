package org.acme.services;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.stream.Collectors;

import org.acme.exeptions.ConflictException;
import org.acme.exeptions.NotFoundException;
import org.acme.models.User;
import org.acme.dtos.admin.UserResponse;
import org.acme.dtos.admin.CreateUserRequest;
import org.acme.dtos.admin.ChangePasswordRequest;
import org.acme.dtos.admin.UpdateUserRequest;

@ApplicationScoped
    public class AdminService {

    @Inject
    PasswordService passwordService;

    public List<UserResponse> getAllUsers() {
        return User.<User>listAll()
                .stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());

    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {

        if (User.find("name", request.username()).firstResult() != null) {
            throw new ConflictException("Username already exists");
        }

        User user = new User();
        user.setName(request.username());
        user.setPassword(passwordService.hash(request.password()));
        user.setRole(request.role());

        user.persist();
        return UserResponse.from(user);
    }


    @Transactional
    public void deleteUser(Long id) {
        if (!User.deleteById(id)) {

            throw new NotFoundException("User with id " + id + " not found");

        }
        /*User user = User.findById(id);

        if (user == null) {
            throw new NotFoundException("User with id " + id + " not found");
        }

        User.deleteById(id);*/
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = User.findById(userId);

        if (user == null) {
            throw new NotFoundException("User with ID " + userId + " not found");
        }

        user.setPassword(passwordService.hash(request.newPassword()));
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = User.findById(id);
        if (user == null) {
            throw new NotFoundException("User with ID " + id + " not found");
        }
        user.setName(request.username());
        user.setRole(request.role());
        //user.persist();
        return UserResponse.from(user);
    }




}
