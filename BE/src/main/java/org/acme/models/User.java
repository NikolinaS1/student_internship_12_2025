package org.acme.models;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import org.acme.enums.Role;

@Entity
public class User extends PanacheEntity {
    private String name;
    private String password;
    private Role role;

    public User() {}
}
