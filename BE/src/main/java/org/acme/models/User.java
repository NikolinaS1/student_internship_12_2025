package org.acme.models;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import org.acme.enums.Role;

@Entity
@Table(name="users")
public class User extends PanacheEntity {
    private String name;
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    public User() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}