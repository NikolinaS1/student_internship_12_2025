package org.acme.services;

import jakarta.enterprise.context.ApplicationScoped;
import org.acme.dtos.UserLogin;
import org.acme.models.User;

@ApplicationScoped
public class UserService {

    public User login(UserLogin login) {
        User user = User.find("name", login.getName()).firstResult();
        if (user == null) {
            return null;
        }
        String passwordHash = user.getPassword();

        if(!passwordHash.equals(login.getPassword())) {
            return null;
        }
        return user;
    }

    public User getUserDetails(Long id) {
        return User.findById(id);
    }
}
